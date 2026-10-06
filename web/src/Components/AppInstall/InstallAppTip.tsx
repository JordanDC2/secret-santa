import { useState } from "react";
import { Alert, Button, Group, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";
import { useAppInstall } from "Components/AppInstall/hooks";
import { showInstallPrompt } from "Components/AppInstall/installPrompt";
import InstallStepsModal from "Components/AppInstall/InstallStepsModal";

const DISMISSED_KEY = "install-tip-dismissed";

function wasDismissed() {
	try {
		return localStorage.getItem(DISMISSED_KEY) === "yes";
	} catch {
		return false;
	}
}

/**
 * For people already signed in (who rarely see the sign-in pages): a one-time, dismissible
 * tip on the dashboard. Only on phones and tablets, never inside the installed app.
 */
export default function InstallAppTip() {
	const { canInstall, platform, promptAvailable } = useAppInstall();
	const [dismissed, setDismissed] = useState(wasDismissed);
	const [stepsOpen, setStepsOpen] = useState(false);

	if (!canInstall || dismissed) {
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
		<>
			<Alert
				color="green"
				icon={<FontAwesomeIcon icon={faMobileScreenButton} />}
				title="Put Secret Santa on your home screen"
				withCloseButton
				closeButtonLabel="Don't show this again"
				onClose={dismiss}
			>
				<MantineText size="sm">
					Open it with one tap, full screen like an app.
					{platform === "ios" && " You'll log in once more inside the app."}
				</MantineText>
				<Group mt="sm">
					<Button size="xs" onClick={() => (promptAvailable ? void showInstallPrompt() : setStepsOpen(true))}>
						{promptAvailable ? "Install" : "Show me how"}
					</Button>
				</Group>
			</Alert>
			<InstallStepsModal platform={platform} opened={stepsOpen} onClose={() => setStepsOpen(false)} />
		</>
	);
}
