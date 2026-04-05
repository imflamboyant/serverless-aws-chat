import {DynamoDBDocumentClient, QueryCommand} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {BedrockRuntimeClient, ConverseStreamCommand} from '@aws-sdk/client-bedrock-runtime';
import {APIGatewayProxyEvent} from 'aws-lambda';

const MESSAGES_LIMIT = 50;
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'eu.amazon.nova-micro-v1:0';

export class SummarizeApiHandler {

    constructor(
        private ddbClient: DynamoDBDocumentClient,
        private bedrockClient: BedrockRuntimeClient,
    ) {
    }

    public summarize = awslambda.streamifyResponse(async (event: APIGatewayProxyEvent, responseStream: awslambda.HttpResponseStream) => {
        const httpStream = awslambda.HttpResponseStream.from(responseStream, {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
            },
        });

        const messagesResult = await this.ddbClient.send(
            new QueryCommand({
                TableName: process.env.MESSAGES_TABLE,
                KeyConditionExpression: 'channel = :channel',
                ExpressionAttributeValues: {
                    ':channel': event.pathParameters?.channel || 'general',
                },
                Limit: MESSAGES_LIMIT,
            })
        );
        const messages = messagesResult.Items ?? [];
        if (messages.length === 0) {
            httpStream.write('No messages to summarize yet.');
            httpStream.end();
            return;
        }

        const command = new ConverseStreamCommand({
            modelId: MODEL_ID,
            messages: [{
                role: 'user',
                content: [{text: `Summarize this group chat in 3-5 concise sentences:\n\n${JSON.stringify(messages)}`}],
            }],
            inferenceConfig: {maxTokens: 512, temperature: 0.3},
        });
        const response = await this.bedrockClient.send(command);
        if (!response.stream) throw new Error('No stream returned from Bedrock');

        for await (const chunk of response.stream) {
            if (chunk.contentBlockDelta?.delta?.text) {
                httpStream.write(chunk.contentBlockDelta.delta.text);
            }
        }
        httpStream.end();
    });
}

const handler = new SummarizeApiHandler(
    DynamoDBDocumentClient.from(new DynamoDBClient({})),
    new BedrockRuntimeClient({}),
);
export const summarize = handler.summarize;