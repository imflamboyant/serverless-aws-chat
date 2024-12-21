# Serverless AWS Chat With IoT Core

This project implements a serverless chat application using AWS IoT Core. It allows real-time communication between devices connected to IoT Core, leveraging AWS services for a scalable and efficient chat solution.

## Project Overview

- Utilizes AWS CDK for infrastructure as code
- Implements serverless architecture using AWS Lambda and IoT Core
- Provides real-time messaging capabilities
- Includes a simple client-side interface for demonstration

## Prerequisites

- Node.js (v20 or later)
- AWS CLI configured with appropriate permissions
- AWS CDK installed (`npm install -g aws-cdk`)

> Note: the code above uses CDK constructs from alpha modules, meaning that it is still considered experimental and under active development.
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

7. Update the client-side application `client/index.html` with the necessary endpoints and credentials obtained above.

## Testing the Application

After deployment, you can test the chat application by:

1. Opening the `client/index.html` file in a web browser
2. Using the AWS IoT Core console to publish messages to the configured topics
3. Observing real-time message updates in the client application

## Cleanup

To avoid incurring future charges, remember to destroy the resources when you're done:
```shell
npx cdk destroy
```