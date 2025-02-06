// endpoints and the api key
const messagesApiUrl = '<API_URL>';
const appSyncRealtime = 'wss://<APPSYNC_EVENT_REALTIME_API_URL>/event/realtime';
const appSyncHttp = '<APPSYNC_HTTP_API_URL>';
const appSyncApiKey = '<APPSYNC_API_KEY>';

// global variables
const currentUser = 'User'+ Math.floor(Math.random() * 1000);
const channelPrefix = '/serverlesschat/channels/';
let currentChannel = null;
let lastSender = '';

// html elements
const channelList = document.getElementById('channelList');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
// set the current user label
document.getElementById('username-label').textContent = currentUser;

// websocket authorization
function getBase64URLEncoded(authorization) {
    return btoa(JSON.stringify(authorization))
        .replace(/\+/g, '-') // Convert '+' to '-'
        .replace(/\//g, '_') // Convert '/' to '_'
        .replace(/=+$/, '') // Remove padding `=`
}

function getAuthProtocol(authorization) {
    const header = getBase64URLEncoded(authorization)
    return `header-${header}`
}

const authorizationData = {
    "host": appSyncHttp,
    "x-api-key": appSyncApiKey
};

// websocket connection with appropriate protocols configured
const websocket = new WebSocket(appSyncRealtime, ['aws-appsync-event-ws', getAuthProtocol(authorizationData)]);

websocket.onopen = () => {
    console.log('WebSocket connected');
    // Populate channel list
    const channels = ['general', 'random', 'tech']; // Example channels
    channels.forEach(channel => {
        const li = document.createElement('li');
        li.textContent = `#${channel}`;
        li.addEventListener('click', () => subscribeToChannel(channel));
        channelList.appendChild(li);
    });

    websocket.onmessage = (event) => {
        const eventData = JSON.parse(event.data);
        // handle incoming messages
        if (eventData.type === 'subscribe_success') {
            console.log('Subscribed to channel ' + currentChannel);
            messagesDiv.innerHTML = '';
            // Add active class to the clicked channel
            document.querySelectorAll(`#channels li`).forEach(ch => {
                if (ch.textContent === '#' + currentChannel) {
                    ch.classList.add('active');
                }
            });
            // fetch existing messages for the channel
            fetch(messagesApiUrl + `/channels/${currentChannel}/messages`)
                .then(response => response.json())
                .then(messages => {
                    messages.forEach(message => {
                        displayMessage(message.message, message.username === currentUser ? 'me' : 'them', message.username);
                    });
                });
        } else if (eventData.type === 'data') {
            const message = JSON.parse(eventData.event);
            console.log(message);
            if (message.username !== currentUser) {
                displayMessage(message.message, 'them', message.username);
            }
        }
    };
}

// handle form input and button
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value;
    const username = currentUser;
    const messagePayload = {
        message: message,
        username: username
    };

    if (message && currentChannel) {
        fetch(messagesApiUrl + `/channels/${currentChannel}/messages`, { method: 'POST', body: JSON.stringify(messagePayload) })
            .then(() => {
                displayMessage(message, 'me', username);
                messageInput.value = '';
            })
    }
}

function subscribeToChannel(channel) {
    if (currentChannel) {
        if (currentChannel === channel) {
            return;
        }
        // unsubscribe from the previous channel
        websocket.send(JSON.stringify({
            "type": "unsubscribe",
            "id": `${currentUser}-${currentChannel}`
        }))
        // Remove active class from the previous channel
        const previousActiveChannel = document.querySelector(`#channels li.active`);
        if (previousActiveChannel) {
            previousActiveChannel.classList.remove('active');
        }
    }
    websocket.send(JSON.stringify({
        "type": "subscribe",
        "id": `${currentUser}-${channel}`,
        "channel": channelPrefix + channel,
        "authorization": authorizationData
    }));
    currentChannel = channel;
}

function displayMessage(message, senderType, sender) {
    const div = document.createElement('div');
    div.className = `message ${senderType}`;

    // Only display the username if it's different from the last sender
    if (sender !== lastSender && sender !== currentUser) {
        const usernameElement = document.createElement('span');
        usernameElement.className = 'username';
        usernameElement.textContent = sender;
        div.appendChild(usernameElement);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = message;

    div.appendChild(bubble);
    messagesDiv.appendChild(div);

    // Update the lastSender variable
    lastSender = sender;

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}