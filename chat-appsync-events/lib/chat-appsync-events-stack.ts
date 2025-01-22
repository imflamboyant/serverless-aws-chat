import * as cdk from 'aws-cdk-lib';
import {SecretValue} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, BillingMode, ITable, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {ApiDestination, Authorization, Connection, HttpMethod} from 'aws-cdk-lib/aws-events';
import {DynamoDBSource, DynamoDBStartingPosition} from '@aws-cdk/aws-pipes-sources-alpha';
import {InputTransformation, Pipe} from '@aws-cdk/aws-pipes-alpha';
import {ApiDestinationTarget} from '@aws-cdk/aws-pipes-targets-alpha';

export class ChatAppsyncEventsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const appSyncEventsApiEndpoint = process.env.APPSYNC_EVENTS_API_ENDPOINT;
        if (!appSyncEventsApiEndpoint) {
            throw new Error('APPSYNC_EVENTS_API_ENDPOINT environment variable is not set');
        }
        const appSyncEventsApiKey = process.env.APPSYNC_EVENTS_API_KEY;
        if (!appSyncEventsApiKey) {
            throw new Error('APPSYNC_EVENTS_API_KEY environment variable is not set');
        }

        // create a DynamoDB table for storing chat messages
        const table: ITable = new Table(this, 'ChatMessagesTable', {
            tableName: 'serverless-chat-appsync-events-messages',
            partitionKey: {name: 'channel', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST,
            stream: StreamViewType.NEW_IMAGE,
        });

        // EventBridge Pipe DynamoDB Stream Source
        const dynamoDbStreamSource = new DynamoDBSource(table, {
            startingPosition: DynamoDBStartingPosition.LATEST,
        });

        // EventBridge API Destination
        const appSyncEventsApiConnection = new Connection(this, 'AppSyncEventApiConnection', {
            authorization: Authorization.apiKey('apiKey', SecretValue.unsafePlainText(appSyncEventsApiKey)),
        });
        const appSyncEventsApiDestination = new ApiDestination(this, 'AppSyncEventApiDestination', {
            connection: appSyncEventsApiConnection,
            endpoint: appSyncEventsApiEndpoint,
            httpMethod: HttpMethod.POST,
        });

        // EventBridge Pipe with API Destination Target & Input Transformation
        const pipe = new Pipe(this, 'EBPipe', {
            source: dynamoDbStreamSource,
            target: new ApiDestinationTarget(appSyncEventsApiDestination, {
                inputTransformation: InputTransformation.fromObject({
                    channel: 'serverlesschat/channels/' + '<$.dynamodb.NewImage.channel.S>',
                    events: [
                        JSON.stringify({
                            channel: '<$.dynamodb.NewImage.channel.S>',
                            timestamp: '<$.dynamodb.NewImage.timestamp.S>',
                            username: '<$.dynamodb.NewImage.username.S>',
                            message: '<$.dynamodb.NewImage.message.S>',
                        })
                    ],
                }),
                headerParameters: {
                    'X-Api-Key': appSyncEventsApiKey,
                }
            }),
        });

        // lambda function to get messages from the DynamoDB table
        const getMessagesLambda = new NodejsFunction(this, 'GetMessagesLambda', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromAsset('src'),
            handler: 'get-messages-handler.getMessages',
            environment: {
                MESSAGES_TABLE: table.tableName,
            },
        });
        table.grantReadData(getMessagesLambda);

        // lambda function to post messages to the DynamoDB table
        const postMessagesLambda = new NodejsFunction(this, 'PostMessagesLambda', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromAsset('src'),
            handler: 'post-messages-handler.postMessages',
            environment: {
                MESSAGES_TABLE: table.tableName,
            },
        })
        table.grantWriteData(postMessagesLambda);

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
        resource.addMethod('POST', new LambdaIntegration(postMessagesLambda));
    }
}
