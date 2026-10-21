import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ICastId, IPatronId } from "Components/SilentNight/types";
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
export type IRun = { seconds: number; kills: number; level: number; bargains: number; won: boolean; bosses: number };

/** What's kept between nights: coal, the Coal Cellar's levels, the second-wave patrons and cast unlocked, and who was last played. */
export type IProgress = {
	coal: number;
	cellar: Record<string, number>;
	patrons: IPatronId[];
	cast: ICastId[];
	character: ICastId;
};

const PROGRESS_KEY = ["silent-night", "progress"];
const LEADERBOARD_KEY = ["silent-night", "leaderboard"];

export function useProgressQuery() {
	return useQuery({
		queryKey: PROGRESS_KEY,
		queryFn: () => apiClient.get<IProgress>("/silent-night/progress"),
	});
}

/** Something bought in the Coal Cellar: an upgrade's next level, or a patron or one of the cast unlocked. */
export type IPurchase = { kind: "cellar" | "patron" | "cast"; item: string };

/** Buying in the Coal Cellar. */
export function useBuyMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (purchase: IPurchase) => apiClient.post<IProgress>("/silent-night/purchases", purchase),
		onSuccess: (progress) => queryClient.setQueryData(PROGRESS_KEY, progress),
	});
}

/** Who to play as (remembered for next time). */
export function useChooseCharacterMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (character: ICastId) => apiClient.patch<IProgress>("/silent-night/progress/character", { character }),
		onSuccess: (progress) => queryClient.setQueryData(PROGRESS_KEY, progress),
	});
}

/** A finished night, kept for the leaderboards (which then show it), and its coal banked. */
export function useRecordRunMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (run: IRun) => apiClient.post<{ coal_earned: number; progress: IProgress }>("/silent-night/runs", run),
		onSuccess: (result) => {
			queryClient.setQueryData(PROGRESS_KEY, result.progress);
			queryClient.invalidateQueries({ queryKey: LEADERBOARD_KEY });
		},
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
