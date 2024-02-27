import { computePosition, flip, shift } from "@floating-ui/dom";
import { createFocusTrap } from "focus-trap";
import { marked } from "marked";

import { widgetHTML } from "./widgetHtmlString";
import css from "./widget.css";

const WIDGET_BACKDROP_ID = "buildship-chat-widget__backdrop";
const WIDGET_CONTAINER_ID = "buildship-chat-widget__container";
const WIDGET_MESSAGES_HISTORY_CONTAINER_ID =
  "buildship-chat-widget__messages_history";

export type WidgetConfig = {
  url: string;
  threadId: string | undefined;
  user: Record<any, any>;
  widgetTitle: string;
  greetingMessage: string | null;
  disableErrorAlert: boolean;
  closeOnOutsideClick: boolean;
};
const config: WidgetConfig = {
  url: "",
  threadId: undefined,
  user: {},
  widgetTitle: "Chatbot",
  greetingMessage: null,
  disableErrorAlert: false,
  closeOnOutsideClick: true,
  ...(window as any).buildShipChatWidget?.config,
};

function init() {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = css;

  document.head.insertBefore(styleElement, document.head.firstChild);

  document
    .querySelector("[data-buildship-chat-widget-button]")
    ?.addEventListener("click", open);
}
window.addEventListener("load", init);

const containerElement = document.createElement("div");
containerElement.id = WIDGET_CONTAINER_ID;

const messagesHistory = document.createElement("div");
messagesHistory.id = WIDGET_MESSAGES_HISTORY_CONTAINER_ID;

const optionalBackdrop = document.createElement("div");
optionalBackdrop.id = WIDGET_BACKDROP_ID;

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
    placement: "bottom",
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

function submit(e: Event) {
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

  createNewMessageEntry(data.message, data.timestamp, "user");

  fetch(config.url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.ok) {
        const { message: responseMessage, threadId: responseThreadId } =
          await res.json();
        await createNewMessageEntry(responseMessage, Date.now(), "system");
        config.threadId = config.threadId ?? responseThreadId;
      } else {
        console.error("BuildShip Chat Widget: Server error", res);
        if (!config.disableErrorAlert)
          alert(`Could not send message: ${res.statusText}`);
      }
    })
    .catch((e) => {
      console.error("BuildShip Chat Widget:", e);
      if (!config.disableErrorAlert)
        alert(`Could not send message: ${e.message}`);
    })
    .finally(() => {
      submitElement.removeAttribute("disabled");
    });

  target.reset();
  return false;
}

const buildShipChatWidget = { open, close, config };
(window as any).buildShipChatWidget = buildShipChatWidget;
declare global {
  interface Window {
    buildShipChatWidget: typeof buildShipChatWidget;
  }
}

export default buildShipChatWidget;
