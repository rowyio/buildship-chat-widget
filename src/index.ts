import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";
import { marked } from "marked";

import { widgetHTML } from "./widgetHtmlString";
import css from "./widget.css";

const WIDGET_BACKDROP_ID = "buildship-chat-widget__backdrop";
const WIDGET_CONTAINER_ID = "buildship-chat-widget__container";
const WIDGET_MESSAGES_HISTORY_CONTAINER_ID =
  "buildship-chat-widget__messages_history";
const WIDGET_THINKING_BUBBLE_ID = "buildship-chat-widget__thinking_bubble";

export type WidgetConfig = {
  url: string;
  threadId: string | undefined;
  responseIsAStream: boolean;
  user: Record<any, any>;
  widgetTitle: string;
  greetingMessage: string | null;
  disableErrorAlert: boolean;
  closeOnOutsideClick: boolean;
  openOnLoad: boolean;
};
const config: WidgetConfig = {
  url: "",
  threadId: undefined,
  responseIsAStream: false,
  user: {},
  widgetTitle: "Chatbot",
  greetingMessage: null,
  disableErrorAlert: false,
  closeOnOutsideClick: true,
  openOnLoad: false,
  ...(window as any).buildShipChatWidget?.config,
};

async function init() {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = css;

  document.head.insertBefore(styleElement, document.head.firstChild);

  // Slight delay to allow DOMContent to be fully loaded
  // (particularly for the button to be available in the `if (config.openOnLoad)` block below).
  await new Promise((resolve) => setTimeout(resolve, 500));

  document
    .querySelector("[data-buildship-chat-widget-button]")
    ?.addEventListener("click", open);

  if (config.openOnLoad) {
    const target = document.querySelector(
      "[data-buildship-chat-widget-button]"
    );
    open({ target } as Event);
  }
}
window.addEventListener("load", init);

const containerElement = document.createElement("div");
containerElement.id = WIDGET_CONTAINER_ID;

const messagesHistory = document.createElement("div");
messagesHistory.id = WIDGET_MESSAGES_HISTORY_CONTAINER_ID;

const optionalBackdrop = document.createElement("div");
optionalBackdrop.id = WIDGET_BACKDROP_ID;

const thinkingBubble = document.createElement("div");
thinkingBubble.id = WIDGET_THINKING_BUBBLE_ID;
thinkingBubble.innerHTML = `
    <span class="circle"></span>
    <span class="circle"></span>
    <span class="circle"></span>
  `;

const trap = createFocusTrap(containerElement, {
  initialFocus: "#buildship-chat-widget__input",
  allowOutsideClick: true,
});

function open(e: Event) {
  if (config.closeOnOutsideClick) {
    document.body.appendChild(optionalBackdrop);
  }

  document.body.appendChild(containerElement);
  containerElement.innerHTML = widgetHTML;
  containerElement.style.display = "block";

  const chatbotHeaderTitleText = document.createElement("span");
  chatbotHeaderTitleText.id = "buildship-chat-widget__title_text";
  chatbotHeaderTitleText.textContent = config.widgetTitle;
  const chatbotHeaderTitle = document.getElementById(
    "buildship-chat-widget__title"
  )!;
  chatbotHeaderTitle.appendChild(chatbotHeaderTitleText);

  const chatbotBody = document.getElementById("buildship-chat-widget__body")!;
  chatbotBody.prepend(messagesHistory);
  if (config.greetingMessage && messagesHistory.children.length === 0) {
    createNewMessageEntry(config.greetingMessage, Date.now(), "system");
  }

  const target = (e?.target as HTMLElement) || document.body;
  computePosition(target, containerElement, {
    placement: "top-start",
    middleware: [flip(), shift({ crossAxis: true, padding: 8 })],
    strategy: "fixed",
  }).then(({ x, y }) => {
    Object.assign(containerElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });

  trap.activate();

  if (config.closeOnOutsideClick) {
    document
      .getElementById(WIDGET_BACKDROP_ID)!
      .addEventListener("click", close);
  }

  document
    .getElementById("buildship-chat-widget__form")!
    .addEventListener("submit", submit);
}

function close() {
  trap.deactivate();

  containerElement.innerHTML = "";
  containerElement.remove();
  optionalBackdrop.remove();
}

async function createNewMessageEntry(
  message: string,
  timestamp: number,
  from: "system" | "user"
) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("buildship-chat-widget__message");
  messageElement.classList.add(`buildship-chat-widget__message--${from}`);
  messageElement.id = `buildship-chat-widget__message--${from}--${timestamp}`;

  const messageText = document.createElement("p");
  messageText.innerHTML = await marked(message);
  messageElement.appendChild(messageText);

  const messageTimestamp = document.createElement("p");
  messageTimestamp.classList.add("buildship-chat-widget__message-timestamp");
  messageTimestamp.textContent =
    ("0" + new Date(timestamp).getHours()).slice(-2) + // Hours (padded with 0 if needed)
    ":" +
    ("0" + new Date(timestamp).getMinutes()).slice(-2); // Minutes (padded with 0 if needed)
  messageElement.appendChild(messageTimestamp);

  messagesHistory.prepend(messageElement);
}

const handleStandardResponse = async (res: Response) => {
  if (res.ok) {
    const {
      message: responseMessage,
      threadId: responseThreadId,
    }: {
      message: string | undefined;
      threadId: string | undefined;
    } = await res.json();

    if (!responseMessage && responseMessage !== "") {
      console.error("BuildShip Chat Widget: Server error", res);
      if (!config.disableErrorAlert)
        alert(
          `Received an OK response but no message was found. Please make sure the API response is configured correctly. You can learn more here:\n\nhttps://github.com/rowyio/buildship-chat-widget?tab=readme-ov-file#connecting-the-widget-to-your-buildship-workflow`
        );
      return;
    }

    await createNewMessageEntry(responseMessage, Date.now(), "system");
    config.threadId = config.threadId ?? responseThreadId;
  } else {
    console.error("BuildShip Chat Widget: Server error", res);
    if (!config.disableErrorAlert)
      alert(`Could not send message: ${res.statusText}`);
  }
};

async function streamResponseToMessageEntry(
  message: string,
  timestamp: number,
  from: "system" | "user"
) {
  const existingMessageElement = messagesHistory.querySelector(
    `#buildship-chat-widget__message--${from}--${timestamp}`
  );
  if (existingMessageElement) {
    // If the message element already exists, update the text
    const messageText = existingMessageElement.querySelector("p")!;
    messageText.innerHTML = await marked(message);
    return;
  } else {
    // If the message element doesn't exist yet, create a new one
    await createNewMessageEntry(message, timestamp, from);
  }
}

const handleStreamedResponse = async (res: Response) => {
  if (!res.body) {
    console.error("BuildShip Chat Widget: Streamed response has no body", res);
    if (!config.disableErrorAlert)
      alert(
        `Received a streamed response but no body was found. Please make sure the API response is configured correctly.`
      );
    return;
  }

  const reader = res.body.getReader();
  let result = "";
  let ts = Date.now();

  while (true) {
    const { value, done } = await reader.read();
    if (done || value === undefined) {
      break;
    }
    const decoded = new TextDecoder().decode(value);
    result += decoded;

    await streamResponseToMessageEntry(result, ts, "system");
  }
};

async function submit(e: Event) {
  e.preventDefault();
  const target = e.target as HTMLFormElement;

  if (!config.url) {
    console.error("BuildShip Chat Widget: No URL provided");
    if (!config.disableErrorAlert)
      alert("Could not send chat message: No URL provided");
    return;
  }

  const submitElement = document.getElementById(
    "buildship-chat-widget__submit"
  )!;
  submitElement.setAttribute("disabled", "");

  const requestHeaders = new Headers();
  requestHeaders.append("Content-Type", "application/json");

  const data = {
    ...config.user,
    message: (target.elements as any).message.value,
    threadId: config.threadId,
    timestamp: Date.now(),
  };

  await createNewMessageEntry(data.message, data.timestamp, "user");
  messagesHistory.prepend(thinkingBubble);

  try {
    let response = await fetch(config.url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(data),
    });
    thinkingBubble.remove();

    if (config.responseIsAStream) {
      await handleStreamedResponse(response);
    } else {
      await handleStandardResponse(response);
    }
  } catch (e: any) {
    thinkingBubble.remove();
    console.error("BuildShip Chat Widget:", e);
    if (!config.disableErrorAlert) {
      alert(`Could not send message: ${e.message}`);
    }
  }

  target.reset();
  submitElement.removeAttribute("disabled");
  return false;
}

const buildShipChatWidget = { open, close, config, init };
(window as any).buildShipChatWidget = buildShipChatWidget;
declare global {
  interface Window {
    buildShipChatWidget: typeof buildShipChatWidget;
  }
}

export default buildShipChatWidget;
