import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Provider } from "react-redux";
import App from "Components/App";
import { store } from "Data/Redux/Store";
import "@mantine/core/styles.css";
import "Styles/index.less";

const root = document.getElementById("app");

if (!root) {
	throw new Error("Root node is undefined.");
}

createRoot(root).render(
	<Provider store={ store }>
		<MantineProvider>
			<App />
		</MantineProvider>
	</Provider>
);
