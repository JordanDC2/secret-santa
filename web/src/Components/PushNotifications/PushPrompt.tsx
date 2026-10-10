import { useEffect, useState } from "react";
import { Alert, Modal, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { usePushDeviceQuery, useTurnOnPushMutation } from "Components/PushNotifications/hooks";
import { apiErrorMessage } from "Data/Api/Client";

/** Set once this device says "Not now"; from then on, the button in Settings is the way back. */
const DECLINED_KEY = "secret-santa-push-prompt-declined";
// Let the page settle first, so it doesn't greet people the instant they arrive.
const DELAY_MS = 3000;

function declined(): boolean {
	try {
		return localStorage.getItem(DECLINED_KEY) !== null;
	} catch {
		return false;
	}
}

function rememberDeclined(): void {
	try {
		localStorage.setItem(DECLINED_KEY, "1");
	} catch {
		// Storage blocked (private browsing): it may ask again next visit.
	}
}

/**
 * The app's own "turn on notifications?" ask, shown once a device could get push but hasn't
 * been asked. Tapping Turn on brings up the browser's real permission dialog (browsers and
 * iPhones only allow that after a tap, and quietly block sites that ask out of the blue).
 * "Not now" never shows the browser's dialog, and it never asks on this device again: they can
 * still turn notifications on from Settings.
 */
export default function PushPrompt() {
	const { pathname } = useLocation();
	const device = usePushDeviceQuery();
	const turnOn = useTurnOnPushMutation();
	const [ready, setReady] = useState(false);
	const [dismissed, setDismissed] = useState(declined);

	useEffect(() => {
		const timer = window.setTimeout(() => setReady(true), DELAY_MS);

		return () => window.clearTimeout(timer);
	}, []);

	const askable = device.data?.support === "supported" && device.data.permission === "default" && !device.data.on;
	// Settings has its own button for this, right there on the page.
	const opened = ready && askable && !dismissed && pathname !== "/settings";

	function notNow() {
		rememberDeclined();
		setDismissed(true);
	}

	return (
		<Modal opened={opened} onClose={notNow} centered size="sm" title="Turn on notifications?">
			<Stack gap="md">
				<MantineText size="sm">
					Get a heads-up on this device when names are drawn, your Secret Santa sends you a message, or the gift
					exchange is getting close. Notifications never say who you&apos;re buying for, and you can choose which ones
					you get in Settings.
				</MantineText>
				{turnOn.isError && <Alert color="red">{apiErrorMessage(turnOn.error)}</Alert>}
				<ConfirmButtons
					confirmLabel="Turn on"
					confirmIcon={<FontAwesomeIcon icon={faBell} />}
					cancelLabel="Not now"
					isPending={turnOn.isPending}
					onConfirm={() => turnOn.mutate(undefined, { onSuccess: () => setDismissed(true) })}
					onCancel={notNow}
				/>
			</Stack>
		</Modal>
	);
}
