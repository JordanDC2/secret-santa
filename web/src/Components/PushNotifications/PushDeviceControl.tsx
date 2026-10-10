import { Alert, Button, Group, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import InstallAppLink from "Components/AppInstall/InstallAppLink";
import { usePushDeviceQuery, useTurnOffPushMutation, useTurnOnPushMutation } from "Components/PushNotifications/hooks";
import { apiErrorMessage } from "Data/Api/Client";

/**
 * Turns push notifications on or off for the device in hand (each phone or computer separately).
 * On iPhone, Apple only allows it once the app is on the Home Screen, so it says so instead.
 */
export default function PushDeviceControl() {
	const device = usePushDeviceQuery();
	const turnOn = useTurnOnPushMutation();
	const turnOff = useTurnOffPushMutation();
	const error = turnOn.error ?? turnOff.error;

	if (!device.data) {
		return null;
	}

	const { support, permission, on } = device.data;

	if (support === "needs-install") {
		return (
			<Alert color="gray" title="Notifications on iPhone and iPad">
				Add Secret Santa to your Home Screen first, then open it from there and turn them on here. <InstallAppLink />
			</Alert>
		);
	}

	if (support === "unsupported") {
		return (
			<MantineText size="sm" c="dimmed">
				This browser can&apos;t show notifications, so you&apos;ll get emails.
			</MantineText>
		);
	}

	if (permission === "denied") {
		return (
			<Alert color="orange" title="Notifications are blocked here">
				Allow notifications for this site in your browser or phone settings, then come back to turn them on.
			</Alert>
		);
	}

	return (
		<Group justify="space-between" gap="sm">
			<MantineText size="sm">
				{on
					? "Notifications are on for this device."
					: "Get a notification on this device as things happen, alongside (or instead of) emails."}
			</MantineText>
			{on ? (
				<Button
					size="xs"
					variant="subtle"
					color="gray"
					leftSection={<FontAwesomeIcon icon={faBellSlash} />}
					loading={turnOff.isPending}
					onClick={() => turnOff.mutate()}
				>
					Turn off on this device
				</Button>
			) : (
				<Button
					size="xs"
					leftSection={<FontAwesomeIcon icon={faBell} />}
					loading={turnOn.isPending}
					onClick={() => turnOn.mutate()}
				>
					Turn on notifications
				</Button>
			)}
			{error && (
				<Alert color="red" w="100%">
					{apiErrorMessage(error)}
				</Alert>
			)}
		</Group>
	);
}
