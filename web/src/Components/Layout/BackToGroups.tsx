import { Anchor } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import classes from "Components/Layout/BackToGroups.module.less";

/** The link back to the dashboard at the top of every page that isn't the dashboard. */
export default function BackToGroups() {
	return (
		<Anchor component={Link} to="/" size="sm" className={classes.link}>
			<FontAwesomeIcon icon={faArrowLeft} />
			Back to your groups
		</Anchor>
	);
}
