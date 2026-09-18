import { createRoot } from "react-dom/client";
import App from "Components/App";
import "@mantine/core/styles.css";
import "Styles/index.less";

const root = document.getElementById("app");

if (!root) {
	throw new Error("Root node is undefined.");
}

createRoot(root).render(<App />);
