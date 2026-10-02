import { useEcho } from "@laravel/echo-react";
import { useQueryClient } from "@tanstack/react-query";
import { GROUPS_QUERY_KEY, useGroupsQuery } from "Components/Groups/hooks";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";

function GroupChannel({ groupId }: { groupId: number }) {
	const queryClient = useQueryClient();

	useEcho(`group.${groupId}`, ".group.changed", () => {
		void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
		// A draw changes who you're buying for, which wishlist pages warn about.
		void queryClient.invalidateQueries({ queryKey: ["wishlist", "member"] });
	});

	return null;
}

/** Listens on every group you're in, so joins, leaves, draws and deletions show up live. */
export default function GroupLiveUpdates() {
	const groupsQuery = useGroupsQuery();

	if (!liveUpdatesEnabled()) {
		return null;
	}

	return groupsQuery.data?.map((group) => <GroupChannel key={group.id} groupId={group.id} />) ?? null;
}
