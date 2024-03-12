# BuildShip AI Chat Widget

An open-source AI chat widget that can be easily embedded on your website or app. This plug-and-play widget is designed to work seamlessly with your custom [BuildShip](https://buildship.com/) workflow, allowing it to connect with your database, knowledge repository, and any other tools that you use.

With this powerful AI chat assistant, you can enhance the user experience of your website or app significantly.

### [TRY LIVE DEMO](https://buildship.com/chat-widget/city-advisor)
<img width="100%" alt="AI Chatbot Widget OpenSource - expanded" src="https://github.com/rowyio/buildship-chat-widget/assets/307298/c14e4861-b2f7-4a0b-bc68-fae6ef7d9381">

## Getting started - in just two steps

1. Load the widget on your page by adding this code snippet and connect the widget to your BuildShip workflow by adding the API URL as per the instructions [here](#connecting-the-widget-to-your-buildship-workflow). Add any [customization](#config-properties) options as needed.

   ```html
   <script src="https://unpkg.com/@buildshipapp/chat-widget@^1" defer></script>
   <script>
     window.addEventListener("load", () => {
       window.buildShipChatWidget.config.widgetTitle = "Chatbot";
       window.buildShipChatWidget.config.greetingMessage = "Hello! How may I help you today?";
       window.buildShipChatWidget.config.url = "https://<project_id>.buildship.run/chat/....";
       <!-- Other optional properties, learn more in the `Config Properties` section below -->
     });
   </script>
   ```

   You may also import it as a module if you're working with TypeScript or ES6 (type declarations are included):

   ```typescript
   import "@buildshipapp/chat-widget";

   window.buildShipChatWidget.config.widgetTitle = "Chatbot";
   window.buildShipChatWidget.config.greetingMessage = "Hello! How may I help you today?";
   window.buildShipChatWidget.config.url = "https://<project_id>.buildship.run/chat/....";
   // ...
   ```

2. Add the button to open the chat widget anywhere on your website:

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

The URL of the endpoint to which the widget will make a POST request when the user sends a message. The endpoint should expect a JSON object in the request body and should respond with a JSON object containing the bot's response and the thread ID.

### `window.buildShipChatWidget.config.threadId` (optional)

A unique identifier for the conversation. This can be used to maintain the context of the conversation across multiple messages/sessions.

If not set, the widget will send the first user message without a thread ID. If you then design your workflow to have it return a thread ID as part of its response (as described in [Request and Response](#request-and-response)), the widget will automatically use that for the rest of the conversation until the script remains loaded -- for example, the thread ID will be discarded if the page is refreshed.

Note: The thread ID returned in the response will not be used if the `threadId` property is already set.

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

Closes the widget when the user clicks outside of the widget body. If set to `false`, you will need to use the `close()` method (provided in the `window.buildShipChatWidget` object) to be able to close the widget programmatically (for example, by attaching it to a button).

Defaults to `true`.

### `window.buildShipChatWidget.config.openOnLoad` (optional)

Automatically opens the widget when the page finishes loading (requires a button with the `data-buildship-chat-widget-button` attribute to be present on the page).

Defaults to `false`.

## How it works

When the script is loaded, it looks for any elements with the `data-buildship-chat-widget-button` attribute and opens the widget when any of those elements are clicked.

In addition to the `config` object, the `window.buildShipChatWidget` object also exposes the `open()`, `close()` and `init()` methods, which can be called directly.

The `open()` method accepts the click `event`, and uses `event.target` to compute the widget's position using [Floating UI](https://floating-ui.com/).

The `close()` method closes the widget.

The `init()` method initializes the widget, and is called automatically when the window finishes loading. It can be called manually to re-initialize the widget if needed (particularly useful in case of SPAs, where the widget might need to be re-initialized after a route change).

## Customizing the widget's appearance

The widget’s styling can be customized by overriding the CSS variables and/or the rules. (See [here](https://github.com/rowyio/buildship-chat-widget/blob/main/src/widget.css) for a list of variables and selectors).

For example, the variables can be overridden like so:

```css
:root {
  --buildship-chat-widget-primary-color: #0000ff;
}

/* Explicitly targeting the light theme is necessary in case the user's system theme is set to 'dark', but the body's `data-theme` attribute is set to `light` (perhaps via a theme toggle on the page). */
[data-theme*="light"] {
  ...;
}
```

Dark mode is activated when either:

- the user's system theme is set to `dark` (i.e. `@media (prefers-color-scheme: dark)` is true) and that's what the page uses, or

- the body has a `data-theme` attribute set to `dark`, like so:

  ```html
  <body data-theme="dark"></body>
  ```

Dark mode styles can be overridden as well:

```css
@media (prefers-color-scheme: dark) {
  :root {
    ...;
  }
}

[data-theme*="dark"] {
  ...;
}
```

The font is inherited from the body.
