import { Anchor, createTheme, type MantineColorsTuple } from "@mantine/core";
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

export const theme = createTheme({
	primaryColor: "red",
	colors: {
		red: festiveRed,
	},
	components: {
		Anchor: Anchor.extend({
			defaultProps: { underline: "never" },
			classNames: { root: classes.anchor },
		}),
	},
});
