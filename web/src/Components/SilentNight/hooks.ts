import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "Data/Api/Client";

export type ILeaderboardBoard = "night" | "krampus" | "kills";
export type ILeaderboardPeriod = "week" | "all";

export type ILeaderboard = {
	entries: { rank: number; name: string; value: number; isYou: boolean }[];
	/** Where the viewer stands, even outside the top; null if they haven't a night on this board (this period). */
	you: { rank: number; value: number } | null;
};

type ILeaderboardResponse = {
	entries: { rank: number; name: string; value: number; is_you: boolean }[];
	you: { rank: number; value: number } | null;
};

/** A finished night, as the server keeps it. */
export type IRun = { seconds: number; kills: number; level: number; bargains: number; won: boolean };

const LEADERBOARD_KEY = ["silent-night", "leaderboard"];

/** A finished night, kept for the leaderboards (which then show it). */
export function useRecordRunMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (run: IRun) => apiClient.post("/silent-night/runs", run),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: LEADERBOARD_KEY }),
	});
}

export function useLeaderboardQuery(board: ILeaderboardBoard, period: ILeaderboardPeriod) {
	return useQuery({
		queryKey: [...LEADERBOARD_KEY, board, period],
		queryFn: async (): Promise<ILeaderboard> => {
			const response = await apiClient.get<ILeaderboardResponse>(
				`/silent-night/leaderboard?board=${board}&period=${period}`,
			);

			return {
				entries: response.entries.map((entry) => ({
					rank: entry.rank,
					name: entry.name,
					value: entry.value,
					isYou: entry.is_you,
				})),
				you: response.you,
			};
		},
		refetchInterval: 5 * 60_000,
	});
}
