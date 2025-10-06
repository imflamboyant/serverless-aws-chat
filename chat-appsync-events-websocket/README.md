# Serverless AWS Chat With AppSync Events - over WebSockets

This project implements a serverless chat application using AWS AppSync Events. It is showcasing a real-time communication between connected clients.
Additionally, it provides the infrastructure to persist and retrieve chat messages.
Communication is via two-way websocket connection, with a synchronous REST API to fetch historical persisted messages per channel.

## Project Overview

- Utilizes AWS CDK for infrastructure as code
- Implements serverless architecture using AWS AppSync Events
- Provides real-time messaging capabilities
- Includes a client-side web interface for demonstration

## Pre-requisites

- Node.js (v20 or later)
- AWS CLI configured with appropriate permissions
- AWS CDK installed (`npm install -g aws-cdk`)

## Deployment Instructions

### Steps

1. Clone the repository:
```shell
git clone https://github.com/imflamboyant/serverless-aws-chat.git
```

2. Navigate to the project directory:
```shell
cd serverless-aws-chat/chat-appsync-events-websocket
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
- update `js/appsync-events-ws.js` with the necessary endpoints and the API key noted from your AppSync Event API

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
