import { Anchor } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import classes from "Components/Layout/BackToGroups.module.less";

/**
 * The link back at the top of every page that isn't the dashboard: to your groups, or for a
 * page inside a section (a game), back to that section.
 */
export default function BackToGroups({ to = "/", label = "Back to your groups" }: { to?: string; label?: string }) {
	return (
		<Anchor component={Link} to={to} size="sm" className={classes.link}>
			<FontAwesomeIcon icon={faArrowLeft} />
			{label}
		</Anchor>
	);
}
