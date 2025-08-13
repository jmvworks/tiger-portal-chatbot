// index.js for Facebook Messenger Bot
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios').default;
const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Webhook verification
app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handles messages and postbacks
app.post('/webhook', (req, res) => {
  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Handles user messages
function handleMessage(sender_psid, received_message) {
  // For any message received, send the main menu.
  sendMainMenu(sender_psid);
}

// Handles menu button clicks (postbacks)
function handlePostback(sender_psid, received_postback) {
  let payload = received_postback.payload;
  let response;

  switch (payload) {
    case 'MENU_OPTION_1':
      response = { "text": "Here is the information for Option 1. It's a great choice!" };
      break;
    case 'MENU_OPTION_2':
      response = { "text": "You picked Option 2! Here are the details you requested." };
      break;
    case 'MENU_OPTION_3':
      response = { "text": "Excellent selection. Here is everything you need to know about Option 3." };
      break;
    default:
      response = { "text": "Sorry, I didn't understand that selection." };
      break;
  }
  callSendAPI(sender_psid, response).then(() => {
    // After sending the unique message, send the "Back to Menu" option
    sendBackToMenu(sender_psid);
  });
}

// Sends the main menu with three options
function sendMainMenu(sender_psid) {
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "Welcome! Please select an option from the menu:",
        "buttons": [
          { "type": "postback", "title": "Option 1", "payload": "MENU_OPTION_1" },
          { "type": "postback", "title": "Option 2", "payload": "MENU_OPTION_2" },
          { "type": "postback", "title": "Option 3", "payload": "MENU_OPTION_3" }
        ]
      }
    }
  };
  callSendAPI(sender_psid, messageData);
}

// Sends a single button to return to the main menu
function sendBackToMenu(sender_psid) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "What would you like to do next?",
                "buttons": [
                    { "type": "postback", "title": "Back to Main Menu", "payload": "MAIN_MENU" }
                ]
            }
        }
    };
    // The postback for "MAIN_MENU" will be handled by your handlePostback function.
    // You'll need to add a case for it to call sendMainMenu(sender_psid).
    callSendAPI(sender_psid, messageData);
}


// The core function that sends messages to the Facebook Messenger Platform
async function callSendAPI(sender_psid, response) {
  let request_body = {
    "recipient": { "id": sender_psid },
    "message": response
  };

  try {
    await axios.post(`https://graph.facebook.com/v23.0/me/messages`, request_body, {
      params: { access_token: PAGE_ACCESS_TOKEN }
    });
    console.log('Message sent successfully!');
  } catch (error) {
    console.error("Unable to send message:", error.response ? error.response.data : error.message);
  }
}

const port = process.env.PORT || 1337;
app.listen(port, () => console.log(`Messenger bot server is listening on port ${port}`));
