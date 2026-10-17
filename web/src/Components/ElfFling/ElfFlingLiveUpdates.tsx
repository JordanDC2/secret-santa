import { useEcho } from "@laravel/echo-react";
import { useQueryClient } from "@tanstack/react-query";
import { LEADERBOARD_KEY } from "Components/ElfFling/hooks";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";

function LeaderboardChannel() {
	const queryClient = useQueryClient();

	useEcho("elf-fling", ".leaderboard.changed", () => {
		void queryClient.invalidateQueries({ queryKey: LEADERBOARD_KEY });
	});

	return null;
}

/** While the leaderboard is on screen, anyone's finished throw updates it within a moment. */
export default function ElfFlingLiveUpdates() {
	return liveUpdatesEnabled() ? <LeaderboardChannel /> : null;
}
