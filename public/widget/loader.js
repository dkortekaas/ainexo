(function () {
  "use strict";

  if (window.chatbotWidgetLoaded) {
    console.warn("Chatbot Widget: Already loaded");
    return;
  }
  window.chatbotWidgetLoaded = true;

  const scriptTag =
    document.currentScript || document.querySelector("script[data-chatbot-id]");

  if (!scriptTag) {
    console.error("Chatbot Widget: Script tag not found");
    return;
  }

  const config = {
    apiKey: scriptTag.getAttribute("data-chatbot-id"),
    apiUrl: scriptTag.getAttribute("data-api-url") || window.location.origin,
    // All other settings will be fetched from the database
  };

  if (!config.apiKey) {
    console.error("Chatbot Widget: Missing data-chatbot-id attribute");
    return;
  }

  Object.keys(config).forEach((key) => {
    if (config[key] === null || config[key] === undefined) {
      delete config[key];
    }
  });

  function loadWidget() {
    console.log(
      "Chatbot Widget: Loading widget bundle from:",
      `${config.apiUrl}/widget/widget-bundle.iife.js`
    );
    console.log("Chatbot Widget: Config:", config);

    const script = document.createElement("script");
    script.src = `${config.apiUrl}/widget/widget-bundle.iife.js`;
    script.async = true;

    script.onload = async function () {
      if (typeof window.initChatbotWidget === "function") {
        try {
          await window.initChatbotWidget(config);
        } catch (error) {
          console.error("Chatbot Widget: Initialization error:", error);
        }
      } else {
        console.error("Chatbot Widget: Initialization function not found");
      }
    };

    script.onerror = function () {
      console.error("Chatbot Widget: Failed to load JavaScript bundle");
    };

    document.body.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadWidget);
  } else {
    loadWidget();
  }
})();
