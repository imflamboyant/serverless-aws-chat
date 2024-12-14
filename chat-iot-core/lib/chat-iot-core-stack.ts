import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {CfnAuthorizer} from 'aws-cdk-lib/aws-iot';

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
    }
}
