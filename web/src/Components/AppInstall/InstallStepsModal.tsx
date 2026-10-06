import { List, Modal, Stack, Text as MantineText } from "@mantine/core";
import type { IInstallPlatform } from "Components/AppInstall/hooks";

type IInstallStepsModalProps = {
	platform: IInstallPlatform;
	opened: boolean;
	onClose: () => void;
};

const STEPS: Record<IInstallPlatform, string[]> = {
	ios: [
		"Open this page in Safari.",
		"Tap the Share button: the square with an arrow pointing up. On newer iPhones it's in the ⋯ menu.",
		'Scroll down and tap "Add to Home Screen", then "Add".',
	],
	android: [
		"Open this page in Chrome.",
		"Tap the ⋮ menu in the top corner.",
		'Tap "Add to home screen" or "Install app", then confirm.',
	],
	other: ["Open your browser's menu or Share button.", 'Look for "Add to Home Screen" or "Install app".'],
};

/** How to add the site to the home screen, for browsers that can't do it in one tap (all iPhones). */
export default function InstallStepsModal({ platform, opened, onClose }: IInstallStepsModalProps) {
	return (
		<Modal opened={opened} onClose={onClose} title="Add Secret Santa to your home screen" centered>
			<Stack gap="md">
				<List type="ordered" spacing="sm">
					{STEPS[platform].map((step) => (
						<List.Item key={step}>{step}</List.Item>
					))}
				</List>
				<MantineText size="sm" c="dimmed">
					It opens full screen like an app, with the Santa hat on your home screen.
					{platform === "ios" && " You'll sign in once more inside the app."} If you got here from an email, open the
					link in your phone&apos;s browser first: apps like Gmail can&apos;t add it.
				</MantineText>
			</Stack>
		</Modal>
	);
}
