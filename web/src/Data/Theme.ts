import { Anchor, createTheme } from "@mantine/core";
import classes from "Data/Theme.module.less";

export const theme = createTheme({
	primaryColor: "red",
	components: {
		Anchor: Anchor.extend({
			defaultProps: { underline: "never" },
			classNames: { root: classes.anchor },
		}),
	},
});
