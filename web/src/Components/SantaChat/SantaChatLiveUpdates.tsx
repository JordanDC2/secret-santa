import { useEcho } from "@laravel/echo-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "Components/Auth/AuthContext";
import { GROUPS_QUERY_KEY } from "Components/Groups/hooks";
import { SANTA_CHAT_QUERY_KEY } from "Components/SantaChat/hooks";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";

function UserChannel({ userId }: { userId: number }) {
	const queryClient = useQueryClient();

	useEcho(`user.${userId}`, ".santa-chat.changed", () => {
		void queryClient.invalidateQueries({ queryKey: SANTA_CHAT_QUERY_KEY });
		// The group cards carry the unread counts.
		void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
	});

	return null;
}

/** New Santa messages and unread badges show up live, on the viewer's own private channel. */
export default function SantaChatLiveUpdates() {
	const { user } = useAuth();

	if (!liveUpdatesEnabled() || !user) {
		return null;
	}

	return <UserChannel userId={user.id} />;
}
