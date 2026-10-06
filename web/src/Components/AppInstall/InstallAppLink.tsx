import { useState } from "react";
import { Anchor, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";
import { useAppInstall } from "Components/AppInstall/hooks";
import { showInstallPrompt } from "Components/AppInstall/installPrompt";
import InstallStepsModal from "Components/AppInstall/InstallStepsModal";

/**
 * A quiet "Get the app" line for the sign-in pages: installing before signing in means
 * signing in only once, inside the app. Only on phones and tablets, never inside the app.
 */
export default function InstallAppLink() {
	const { canInstall, platform, promptAvailable } = useAppInstall();
	const [stepsOpen, setStepsOpen] = useState(false);

	if (!canInstall) {
		return null;
	}

	return (
		<>
			<MantineText ta="center" mt="sm">
				<Anchor
					component="button"
					type="button"
					size="sm"
					onClick={() => (promptAvailable ? void showInstallPrompt() : setStepsOpen(true))}
				>
					<FontAwesomeIcon icon={faMobileScreenButton} /> Add Secret Santa to your home screen
				</Anchor>
			</MantineText>
			<InstallStepsModal platform={platform} opened={stepsOpen} onClose={() => setStepsOpen(false)} />
		</>
	);
}
