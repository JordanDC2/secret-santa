import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentSubscription, pushSupport, turnOffPush, turnOnPush } from "Components/PushNotifications/devicePush";

const DEVICE_QUERY_KEY = ["push", "device"];

export type IPushDeviceState = {
	support: ReturnType<typeof pushSupport>;
	/** The browser's answer to "allow notifications?": not asked yet, allowed, or blocked. */
	permission: NotificationPermission | null;
	/** Whether this device is getting pushes. */
	on: boolean;
};

/** Whether push works here and whether it's on, for the Settings switch. */
export function usePushDeviceQuery() {
	return useQuery({
		queryKey: DEVICE_QUERY_KEY,
		queryFn: async (): Promise<IPushDeviceState> => {
			const support = pushSupport();

			if (support !== "supported") {
				return { support, permission: null, on: false };
			}

			return {
				support,
				permission: Notification.permission,
				on: Notification.permission === "granted" && (await currentSubscription()) !== null,
			};
		},
	});
}

export function useTurnOnPushMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: turnOnPush,
		onSettled: () => queryClient.invalidateQueries({ queryKey: DEVICE_QUERY_KEY }),
	});
}

export function useTurnOffPushMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: turnOffPush,
		onSettled: () => queryClient.invalidateQueries({ queryKey: DEVICE_QUERY_KEY }),
	});
}
