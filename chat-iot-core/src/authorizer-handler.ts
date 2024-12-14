import {IoTCustomAuthorizerEvent} from 'aws-lambda';
import {IoTCustomAuthorizerResult} from 'aws-lambda/trigger/iot-authorizer';

export class LambdaAuthorizerHandler {

    public async authorize(event: IoTCustomAuthorizerEvent): Promise<string> {
        const region = process.env.AWS_REGION;
        const accountId = process.env.AWS_ACCOUNT_ID;
        const response: IoTCustomAuthorizerResult = {
            isAuthenticated: true,
            principalId: 'principalId',
            disconnectAfterInSeconds: 3600,
            refreshAfterInSeconds: 300,
            policyDocuments: [
                {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: 'iot:*',
                            Effect: 'Allow',
                            Resource: `arn:aws:iot:${region}:${accountId}:*`,
                        },
                    ],
                },
            ],
        };
        return JSON.stringify(response);
    }
}

const handler = new LambdaAuthorizerHandler();
export const authorize = handler.authorize.bind(handler);