// Runs before the page draws (index.html loads it without defer), so dark mode doesn't flash
// white. Same key and rule as the app's colorSchemeManager (Components/App.tsx): a saved choice,
// else the system setting.
try {
	var saved = localStorage.getItem("secret-santa-color-scheme");
	var dark = saved === "dark" || (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.setAttribute("data-mantine-color-scheme", dark ? "dark" : "light");
} catch {
	// Storage blocked (private browsing): the app sorts it out once it loads.
}
