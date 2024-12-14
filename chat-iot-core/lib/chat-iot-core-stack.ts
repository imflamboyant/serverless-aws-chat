import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {CfnAuthorizer} from 'aws-cdk-lib/aws-iot';
import {AttributeType, BillingMode, ITable, Table} from 'aws-cdk-lib/aws-dynamodb';
import {IotSql, TopicRule} from '@aws-cdk/aws-iot-alpha';
import {DynamoDBv2PutItemAction} from '@aws-cdk/aws-iot-actions-alpha';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';

export class ChatIotCoreStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        // create the authorizer lambda
        const authorizerLambda = new NodejsFunction(this, 'AuthorizerLambda', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromAsset('src'),
            handler: 'authorizer-handler.authorize',
            environment: {
                AWS_ACCOUNT_ID: this.account,
            },
        });
        // allow IoT to invoke the Lambda function
        authorizerLambda.addPermission('AllowIoTInvoke', {
            action: 'lambda:InvokeFunction',
            principal: new ServicePrincipal('iot.amazonaws.com'),
        });
        // create the IoT custom authorizer and attach the lambda to it
        new CfnAuthorizer(this, 'ServerlessChatIoTAuthorizer', {
            authorizerName: 'ServerlessChatIoTAuthorizer',
            authorizerFunctionArn: authorizerLambda.functionArn,
            status: 'ACTIVE',
            signingDisabled: true,
        });
        // create a DynamoDB table for storing chat messages
        const table: ITable = new Table(this, 'ChatMessagesTable', {
            tableName: 'serverless-chat-iot-core-messages',
            partitionKey: {name: 'channel', type: AttributeType.STRING},
            sortKey: {name: 'timestamp', type: AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
        // create IoT Rule and Rule Action to send messages to the DynamoDB table
        new TopicRule(this, 'SendMessagesToDynamoDB', {
            topicRuleName: 'serverless_chat_iot_core_ddb_rule',
            sql: IotSql.fromStringAsVer20160323('SELECT channel, parse_time("yyyy-MM-dd\'T\'HH:mm:ss.SSSz", timestamp()) AS timestamp, username, message FROM \'serverlesschat/channels/+\''),
            enabled: true,
            actions: [
                new DynamoDBv2PutItemAction(table),
            ],
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
        // rest api to get messages from the DynamoDB table
        const api = new RestApi(this, 'ServerlessChatApi', {
            restApiName: 'Serverless Chat API',
        });
        api.root
            .addResource('channels').addResource('{channel}').addResource('messages')
            .addMethod('GET', new LambdaIntegration(getMessagesLambda));
    }
}
