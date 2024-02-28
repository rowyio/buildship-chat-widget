# BuildShip Chat Widget

A chat widget built to work in tandem with your own custom [BuildShip](https://buildship.com/) workflow that you can plug in anywhere on your website. Built by the [Rowy](https://www.rowy.io/) team.

## Getting started

1. Load the widget on your page:

   ```html
   <script src="https://unpkg.com/@buildshipapp/chat-widget@^1" defer></script>
   ```

2. Configure the widget:

   ```html
   <script>
     window.addEventListener("load", () => {
       window.buildShipChatWidget.config.widgetTitle = "Chatbot";
       window.buildShipChatWidget.config.greetingMessage = "Hello! How may I help you today?";
       window.buildShipChatWidget.config.url = "https://projectid.buildship.run/chat/...."
       <!-- ...other optional properties, learn more in the 'Config Properties' section below -->
     });
   </script>
   ```

3. Set a button to open the widget:

   ```html
   <button data-buildship-chat-widget-button>Beep Boop</button>
   ```

## Connecting the widget to your BuildShip workflow

The widget is built to work with your custom BuildShip workflow. You can connect the widget to your workflow by setting the `window.buildShipChatWidget.config.url` property to the workflow's endpoint.

### Request and Response

1. The widget will make a POST request to this URL. The request body will be an object containing the user's message and other data for the workflow to make use of, like so:

   ```json
   {
     "message": "The user's message",
     "threadId": "A unique identifier for the conversation (learn more below)",
     "timestamp": "The timestamp of when the POST request was initiated"

     ...Other miscellaneous user data (learn more in the 'Config Properties' section below)
   }
   ```

   You can learn more about each of the properties [in the next section](#config-properties).

2. The widget will expect a response from the endpoint in the form of a JSON object containing the workflow's response (`message`) and the thread ID (`threadId`), like so:

   ```json
   {
     "message": "The bot's response",
     "threadId": "The unique identifier for the conversation (learn more below)"
   }
   ```

## Config Properties

The widget can be customized by editing the properties present in the `window.buildShipChatWidget.config` object. The following properties can be set:

### `window.buildShipChatWidget.config.url` (required)

The URL of the endpoint to which the widget will make a POST request when the user sends a message. The endpoint should expect a JSON object in the request body and should respond with a JSON object containing the bot's response and the thread ID (as described [above](#request-and-response)).

### `window.buildShipChatWidget.config.threadId` (optional)

A unique identifier for the conversation. This can be used to maintain the context of the conversation across multiple messages/sessions.

If not set, the widget will generate a random thread ID for the first user message and use that for the rest of the conversation until the script remains loaded -- for example, the thread ID will be discarded if the page is refreshed.

### `window.buildShipChatWidget.config.user` (optional)

An object containing the user's data. This can be used to send the user's name, email, or any other data that the workflow might need. Example:

```js
window.buildShipChatWidget.config.user = {
  name: "Some User",
  email: "user@email.com",
  // ...Other user data
};
```

### `window.buildShipChatWidget.config.widgetTitle` (optional)

The title of the widget. This will be displayed at the top of the widget.

Defaults to `Chatbot`.

### `window.buildShipChatWidget.config.greetingMessage` (optional)

The message that will be displayed (as though it were sent by the system) when the widget is first opened.

Defaults to not displaying any greeting message.

### `window.buildShipChatWidget.config.disableErrorAlert` (optional)

Disables error alerts if no URL is set, if the request fails, etc.

Defaults to `false`.

### `window.buildShipChatWidget.config.closeOnOutsideClick` (optional)

Closes the widget when the user clicks outside of the widget body. If not set to `false`, you will need to use the `close()` method (provided in the `window.buildShipChatWidget` object) to be able to close the widget programmatically (for example, by attaching it to a button).

Defaults to `true`.

## How it works

When the script is loaded, it looks for any elements with the `data-buildship-chat-widget-button` attribute and opens the widget when any of those elements are clicked.

In addition to the `config` object, the `window.buildShipChatWidget` object also exposes the `open()` & `close()` methods, which can be called directly.

The `open()` method accepts the click `event`, and uses `event.target` to compute the widget's position using [Floating UI](https://floating-ui.com/).
