// endpoints
const messagesApiUrl = '<API_ENDPOINT>';
const brokerUrl = '<MQTT_BROKER_ENDPOINT>';

// global variables
const currentUser = 'User'+ Math.floor(Math.random() * 1000);
const channelPrefix = 'serverlesschat/channels/';
let currentChannel = null;
let lastSender = '';

// html elements
const channelList = document.getElementById('channelList');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
// set the current user label
document.getElementById('username-label').textContent = currentUser;

// mqtt connection
const mqttClient = mqtt.connect(brokerUrl, { clientId: currentUser });
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Populate channel list
    const channels = ['general', 'random', 'tech']; // Example channels
    channels.forEach(channel => {
        const li = document.createElement('li');
        li.textContent = `#${channel}`;
        li.addEventListener('click', () => subscribeToChannel(channel));
        channelList.appendChild(li);
    });
});
mqttClient.on('message', (topic, message) => {
    const messageData = JSON.parse(message.toString());

    // Check if the sender is the current user
    if (messageData.username !== currentUser) {
        displayMessage(messageData.message, 'them', messageData.username);
    }
});

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
        channel: currentChannel,
        message: message,
        username: username
    };

    if (message && currentChannel) {
        mqttClient.publish(channelPrefix + currentChannel, JSON.stringify(messagePayload));
        displayMessage(message, 'me', username);
        messageInput.value = '';
    }
}

function subscribeToChannel(channel) {
    if (currentChannel) {
        mqttClient.unsubscribe(currentChannel);
        // Remove active class from the previous channel
        const previousActiveChannel = document.querySelector(`#channels li.active`);
        if (previousActiveChannel) {
            previousActiveChannel.classList.remove('active');
        }
    }
    currentChannel = channel;
    mqttClient.subscribe(channelPrefix + currentChannel, (err) => {
        if (!err) {
            console.log(`Subscribed to ${channelPrefix + currentChannel}`);
            messagesDiv.innerHTML = '';
            // Add active class to the clicked channel
            document.querySelectorAll(`#channels li`).forEach(ch => {
                if (ch.textContent === '#' + channel) {
                    ch.classList.add('active');
                }
            });
            // fetch existing messages from api
            fetch(messagesApiUrl + `/${currentChannel}/messages`)
                .then(response => response.json())
                .then(messages => {
                    messages.forEach(message => {
                        displayMessage(message.message, message.username === currentUser ? 'me' : 'them', message.username);
                    });
                });
        }
    });
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