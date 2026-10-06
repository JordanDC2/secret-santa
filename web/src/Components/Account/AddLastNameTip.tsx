import { useState } from "react";
import { Alert, Button, Group, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdBadge } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";

const DISMISSED_KEY = "last-name-tip-dismissed";

function wasDismissed() {
	try {
		return localStorage.getItem(DISMISSED_KEY) === "yes";
	} catch {
		return false;
	}
}

/**
 * Accounts from before last names existed, whose name was one word, have none yet. A one-time,
 * dismissible tip on the dashboard asks them to add it.
 */
export default function AddLastNameTip() {
	const { user } = useAuth();
	const [dismissed, setDismissed] = useState(wasDismissed);

	if (!user || user.lastName || dismissed) {
		return null;
	}

	function dismiss() {
		try {
			localStorage.setItem(DISMISSED_KEY, "yes");
		} catch {
			// Private browsing: it just shows again next time.
		}
		setDismissed(true);
	}

	return (
		<Alert
			color="green"
			icon={<FontAwesomeIcon icon={faIdBadge} />}
			title="Add your last name"
			withCloseButton
			closeButtonLabel="Don't show this again"
			onClose={dismiss}
		>
			<MantineText size="sm">
				It goes on your wishlist so people know it&apos;s yours, and tells you apart from anyone in your groups with the
				same first name.
			</MantineText>
			<Group mt="sm">
				<Button size="xs" component={Link} to="/account">
					Add it
				</Button>
			</Group>
		</Alert>
	);
}
