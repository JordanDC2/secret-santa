import { useEffect } from "react";
import { currentSubscription, saveSubscription } from "Components/PushNotifications/devicePush";

/**
 * On each signed-in visit, re-sends this device's push address if it has one. Browsers can
 * change it now and then, and it keeps the server's copy current. Renders nothing.
 */
export default function PushSync() {
	useEffect(() => {
		async function resend() {
			const subscription = await currentSubscription();

			if (subscription && Notification.permission === "granted") {
				await saveSubscription(subscription);
			}
		}

		resend().catch(() => {
			// Best effort: the next visit tries again.
		});
	}, []);

	return null;
}
