import {
	Anchor,
	Button,
	Checkbox,
	createTheme,
	Modal,
	Title,
	type ButtonVariant,
	type CSSVariablesResolver,
	type MantineColorsTuple,
} from "@mantine/core";
import classes from "Data/Theme.module.less";

/**
 * Mantine's "red", rebuilt around the festive red (#c00026, shade 6 = filled buttons) so every
 * red button, link, badge and alert matches the header, cards and emails. Overriding the
 * palette itself means existing color="red" props pick it up without changes.
 */
const festiveRed: MantineColorsTuple = [
	"#fff0f2",
	"#ffdde2",
	"#fbb3bd",
	"#f68495",
	"#ef5a72",
	"#e3334f",
	"#c00026",
	"#a8001f",
	"#8c0019",
	"#700014",
];

/**
 * Mantine's "green", rebuilt around the forest green of the festive illustrations (#286e45,
 * shade 6). Mantine's default lime-ish green failed contrast with white text (2.4:1);
 * this one passes (5:1) for the Draw Names, claim and reveal buttons and green alerts.
 */
const festiveGreen: MantineColorsTuple = [
	"#edf7f0",
	"#d7ecdf",
	"#aed8bf",
	"#82c39c",
	"#5daf7e",
	"#3a915e",
	"#286e45",
	"#236140",
	"#1f5c39",
	"#164429",
];

/**
 * Mantine's "orange" (warnings, e.g. "this isn't your Secret Santa person"), rebuilt as a
 * warm amber from the festive gold, dark enough at shade 6 to read on the light alert tint.
 */
const festiveAmber: MantineColorsTuple = [
	"#fff7e6",
	"#fdecc8",
	"#f9d78f",
	"#f3c15a",
	"#e8a93b",
	"#b0700e",
	"#8c5309",
	"#764506",
	"#663c05",
	"#4d2d03",
];

const fontFamily = "Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/*
 * Buttons have four roles:
 * - primary: the main action, green filled (the default: no color or variant needed);
 * - secondary: other actions, variant="secondary" (pale gold, see Theme.module.less);
 * - quiet: back out or undo, variant="subtle" color="gray";
 * - destructive: color="red", subtle to start and filled to confirm.
 * Red is kept for links, the header and destructive actions, so a red button always deletes.
 */
declare module "@mantine/core" {
	export interface ButtonProps {
		variant?: ButtonVariant | "secondary";
	}
}

export const theme = createTheme({
	primaryColor: "green",
	colors: {
		red: festiveRed,
		green: festiveGreen,
		orange: festiveAmber,
	},
	fontFamily,
	headings: { fontFamily, fontWeight: "800" },
	components: {
		Anchor: Anchor.extend({
			defaultProps: { underline: "never" },
			classNames: { root: classes.anchor },
		}),
		// Checkboxes confirm or choose things (e.g. "Avoid last draw's matches"), not warn.
		Button: Button.extend({
			classNames: { root: classes.button },
		}),
		Checkbox: Checkbox.extend({
			defaultProps: { color: "green" },
		}),
		Modal: Modal.extend({
			classNames: { title: classes.modalTitle },
		}),
		Title: Title.extend({
			classNames: { root: classes.title },
		}),
	},
});

/**
 * Links default to the primary color, which is green now; keep them festive red. Set as
 * Mantine's anchor variable (not an Anchor color prop) so classes like the header's gold
 * nav links can still override it.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
	variables: {},
	light: { "--mantine-color-anchor": "var(--mantine-color-red-filled)" },
	dark: { "--mantine-color-anchor": "var(--mantine-color-red-4)" },
});
