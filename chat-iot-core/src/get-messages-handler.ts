import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {DynamoDBDocumentClient, QueryCommand} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';

export class GetMessagesApiHandler {

    constructor(private ddbClient: DynamoDBDocumentClient) {
    }

    public async getMessages(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        const table = process.env.MESSAGES_TABLE;
        const channel = event.pathParameters?.channel || 'general';
        const result = await this.ddbClient.send(
            new QueryCommand({
                TableName: table,
                KeyConditionExpression: 'channel = :channel',
                ExpressionAttributeValues: {
                    ':channel': channel,
                },
            })
        );
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
        };
    }
}

const handler = new GetMessagesApiHandler(DynamoDBDocumentClient.from(new DynamoDBClient({})));
export const getMessages = handler.getMessages.bind(handler);