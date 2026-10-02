import { createRoot } from "react-dom/client";
import App from "Components/App";
import { configureLiveUpdates } from "Data/Api/LiveUpdates";
import "@mantine/core/styles.css";
import "Styles/index.less";

const root = document.getElementById("app");

if (!root) {
	throw new Error("Root node is undefined.");
}

configureLiveUpdates();

createRoot(root).render(<App />);
