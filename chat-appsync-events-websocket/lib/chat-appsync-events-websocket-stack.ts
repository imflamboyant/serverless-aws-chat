import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, BillingMode, ITable, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';

export class ChatAppsyncEventsWebsocketStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // create a DynamoDB table for storing chat messages
        const table: ITable = new Table(this, 'ChatMessagesTable', {
            tableName: 'serverless-chat-appsync-events-ws-messages',
            partitionKey: {name: 'channel', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST,
            stream: StreamViewType.NEW_IMAGE,
            removalPolicy: RemovalPolicy.DESTROY, // do not use in production
        });

        // lambda function to get messages from the DynamoDB table
        const getMessagesLambda = new NodejsFunction(this, 'GetMessagesLambda', {
            runtime: Runtime.NODEJS_22_X,
            code: Code.fromAsset('src'),
            handler: 'get-messages-handler.getMessages',
            environment: {
                MESSAGES_TABLE: table.tableName,
            },
        });
        table.grantReadData(getMessagesLambda);

        // rest api to get messages from the DynamoDB table
        const api = new RestApi(this, 'ServerlessChatApi', {
            restApiName: 'Serverless Chat API',
            defaultCorsPreflightOptions: {
                allowOrigins: ['*'],
                allowMethods: ['*'],
            }
        });
        const resource = api.root.addResource('channels').addResource('{channel}').addResource('messages');
        resource.addMethod('GET', new LambdaIntegration(getMessagesLambda));
    }
}
