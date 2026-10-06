// Mantine's base styles must load before any component's CSS module, or Mantine's rules win
// ties against the app's own classes (e.g. a modal title's custom font size).
import "@mantine/core/styles.css";
import "Styles/index.less";
import { createRoot } from "react-dom/client";
import App from "Components/App";
import { listenForInstallPrompt } from "Components/AppInstall/installPrompt";
import { configureLiveUpdates } from "Data/Api/LiveUpdates";
import { trackPointerForInputGlow } from "Styles/inputGlow";

const root = document.getElementById("app");

if (!root) {
	throw new Error("Root node is undefined.");
}

configureLiveUpdates();
// Before rendering: Android's "can be installed" event fires early and only once.
listenForInstallPrompt();
trackPointerForInputGlow();

createRoot(root).render(<App />);
