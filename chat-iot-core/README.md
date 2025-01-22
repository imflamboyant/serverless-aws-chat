# Serverless AWS Chat With IoT Core

This project implements a serverless chat application using AWS IoT Core. It is showcasing a real-time communication between connected clients.
Additionally, it provides the infrastructure to persist and retrieve chat messages.

## Project Overview

- Utilizes AWS CDK for infrastructure as code
- Implements serverless architecture using AWS Lambda, IoT Core & DynamoDB
- Provides real-time messaging capabilities
- Includes a simple client-side web interface for demonstration

## Prerequisites

- Node.js (v20 or later)
- AWS CLI configured with appropriate permissions
- AWS CDK installed (`npm install -g aws-cdk`)

> Note: the project uses CDK constructs from IoT Core alpha modules, meaning that they are still considered experimental and under active development.
Please be aware that breaking changes might happen in the future. I will keep the codebase up to date, and in the meantime
feel free to consult the CDK docs of [aws-iot-alpha](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-iot-alpha-readme.html)
and [aws-iot-actions-alpha](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-iot-actions-alpha-readme.html) for details.

## Deployment Instructions

1. Clone the repository:
```shell
git clone https://github.com/imflamboyant/serverless-aws-chat.git
```

2. Navigate to the project directory:
```shell
cd serverless-aws-chat/chat-iot-core
```

3. Install dependencies:
```shell
npm install
```

4. Build the project:
```shell
npm run build
```

5. Deploy the stack to your AWS account:
```shell
npx cdk deploy
```
Note the outputs from the CDK deployment, specifically the API Gateway endpoint.

6. Get the IoT Core regional endpoint by running:
```shell
aws iot describe-endpoint
```
Make sure the region is set to the region you are deploying to. Also, you can find your endpoint by navigating to IoT Core > MQTT test client in the AWS Console.

7. Then, to make the authorizer actually work, it has to be specified as a query parameter. An example URL is:
```shell
'wss://xyz.iot.{region}.amazonaws.com/mqtt?x-amz-customauthorizer-name=ServerlessChatIoTAuthorizer'
```

**Note: ** `ServerlessChatIoTAuthorizer` is the name of the authorizer given in the CDK code.

8. Finally, update the client-side application
- uncomment the lines as instructed in `./client/index.html`
- update `js/iot-core.js` with the necessary endpoints and credentials obtained above

## Testing the Application

After deployment, you can test the chat application by:

1. Opening multiple instances of `./client/index.html` file in a web browser
    - each client gets a randomly generated username
2. Sending messages from different clients
3. Observing real-time message updates in the client application

## Cleanup

To avoid incurring future charges, remember to destroy the resources when you're done:
```shell
npx cdk destroy
```