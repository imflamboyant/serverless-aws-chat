import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {DynamoDBDocumentClient, PutCommand} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';

export class PostMessagesApiHandler {

    constructor(private ddbClient: DynamoDBDocumentClient) {
    }

    public async getMessages(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        const table = process.env.MESSAGES_TABLE;
        const channel = event.pathParameters?.channel || 'general';
        const item = {
            channel,
            timestamp: new Date().toISOString(),
            username: JSON.parse(event.body!).username,
            message: JSON.parse(event.body!).message,
        };
        await this.ddbClient.send(
            new PutCommand({
                TableName: table,
                Item: item,
            })
        );
        return {
            statusCode: 201,
            body: JSON.stringify(item),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
        };
    }
}

const handler = new PostMessagesApiHandler(DynamoDBDocumentClient.from(new DynamoDBClient({})));
export const postMessages = handler.getMessages.bind(handler);