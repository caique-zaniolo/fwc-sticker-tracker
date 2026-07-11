import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Reload once the new service worker takes control, so an update installed
// in the background (e.g. while the app was in the background) shows up
// immediately instead of waiting for the next cold launch.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

registerSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Browsers throttle automatic SW update checks to ~once/24h. Force a
    // check whenever the app is opened or brought back to the foreground.
    registration.update();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update();
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
