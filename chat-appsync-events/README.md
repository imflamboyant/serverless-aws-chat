# Serverless AWS Chat With AppSync Events

This project implements a serverless chat application using AWS AppSync Events. It is showcasing a real-time communication between connected clients.
Additionally, it provides the infrastructure to persist and retrieve chat messages.

## Project Overview

- Utilizes AWS CDK for infrastructure as code
- Implements serverless architecture using AWS AppSync Events
- Provides real-time messaging capabilities
- Includes a client-side web interface for demonstration

## Pre-requisites

- Node.js (v20 or later)
- AWS CLI configured with appropriate permissions
- AWS CDK installed (`npm install -g aws-cdk`)

> Note: the project uses CDK constructs from AWS Pipes alpha modules, meaning that they are still considered experimental and under active development.
Please be aware that breaking changes might happen in the future. I will keep the codebase up to date, and in the meantime
feel free to consult the CDK docs of [aws-pipes-alpha](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-pipes-alpha-readme.html) for details.

## Deployment Instructions

### Pre-requisites

> ~~Since L2 CDK constructs for AppSync Event API are not yet released, this project requires you to manually create the AppSync Event API 🙈
To create it navigate the AWS console in your account to AppSync > Create Event API. After that, create an API key for authorization,
and create a namespace `serverlesschat`. Make a note of API realtime and HTTP endpoints, as well as the API key, and that
should be enough to make you ready to plug in this project on top of AppSync Events. Consult the [AWS guide](https://docs.aws.amazon.com/appsync/latest/eventapi/create-event-api-tutorial.html) if you get stuck.~~
>
> ~~**Note:** As soon as the L2 constructs are released, this code will be updated to a more unified deployment.~~
> 
> 💡 Since L2 constructs are officially released (since CDK version 2.178.0), the project is updated and now AppSync Event API is deployed out of the box!

### Steps

1. Clone the repository:
```shell
git clone https://github.com/imflamboyant/serverless-aws-chat.git
```

2. Navigate to the project directory:
```shell
cd serverless-aws-chat/chat-appsync-events
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

6. Update the client-side application
- uncomment the lines as instructed in `./client/index.html`
- update `js/appsync-events.js` with the necessary endpoints and the API key noted from your AppSync Event API

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
