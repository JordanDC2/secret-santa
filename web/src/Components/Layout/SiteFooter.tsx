import { Anchor, Group, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import { SITE_OWNER } from "Components/Legal/legal";
import classes from "Components/Layout/SiteFooter.module.less";

/** For the copyright line; read once when the app loads. */
const YEAR = new Date().getFullYear();

/** Privacy, Terms and the copyright line, at the bottom of every page. */
export default function SiteFooter({ onDark = false }: { onDark?: boolean }) {
	return (
		<MantineText
			component="footer"
			size="xs"
			c={onDark ? undefined : "dimmed"}
			className={[classes.footer, onDark ? classes.onDark : ""].join(" ")}
		>
			<Group gap="xs" justify="center" component="span">
				<Anchor component={Link} to="/privacy" size="xs">
					Privacy
				</Anchor>
				<span aria-hidden="true">·</span>
				<Anchor component={Link} to="/terms" size="xs">
					Terms
				</Anchor>
				<span aria-hidden="true">·</span>
				<span>
					© {YEAR} {SITE_OWNER}
				</span>
			</Group>
		</MantineText>
	);
}
