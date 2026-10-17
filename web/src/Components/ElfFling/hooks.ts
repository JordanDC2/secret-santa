import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IProgress } from "Components/ElfFling/progress";
import type { IBatterId, ISkinId } from "Components/ElfFling/skins";
import type { IUpgradeId, IUpgrades } from "Components/ElfFling/upgrades";
import { apiClient } from "Data/Api/Client";

/** The player's progress as the API sends it. */
type IProgressResponse = {
	coins: number;
	upgrades: IUpgrades;
	skins: ISkinId[];
	skin: ISkinId;
	batters: IBatterId[];
	batter: IBatterId;
	best_distance: number | null;
	imported: boolean;
};

export type ILeaderboardBoard = "distance" | "coins" | "swings";
export type ILeaderboardPeriod = "week" | "all";

export type ILeaderboard = {
	entries: { rank: number; name: string; value: number; isYou: boolean }[];
	/** Where the viewer stands, even outside the top; null if they haven't played (this period). */
	you: { rank: number; value: number } | null;
};

type ILeaderboardResponse = {
	entries: { rank: number; name: string; value: number; is_you: boolean }[];
	you: { rank: number; value: number } | null;
};

const PROGRESS_KEY = ["elf-fling", "progress"];
const LEADERBOARD_KEY = ["elf-fling", "leaderboard"];

function toProgress(response: IProgressResponse): IProgress {
	return {
		coins: response.coins,
		upgrades: response.upgrades,
		skins: response.skins,
		skin: response.skin,
		batters: response.batters,
		batter: response.batter,
		bestDistance: response.best_distance,
		imported: response.imported,
	};
}

export function useProgressQuery() {
	return useQuery({
		queryKey: PROGRESS_KEY,
		queryFn: async () => toProgress(await apiClient.get<IProgressResponse>("/elf-fling/progress")),
	});
}

/** A finished throw: the server banks its coins (adding the lucky stocking) and ranks it. */
export function useRecordThrowMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (details: { distance: number; coinsCollected: number }) => {
			const response = await apiClient.post<{ progress: IProgressResponse; banked: number; new_best: boolean }>(
				"/elf-fling/throws",
				{ distance: details.distance, coins_collected: details.coinsCollected },
			);

			return { progress: toProgress(response.progress), banked: response.banked, newBest: response.new_best };
		},
		onSuccess: ({ progress }) => {
			queryClient.setQueryData(PROGRESS_KEY, progress);
			// Somebody's standing may have moved.
			queryClient.invalidateQueries({ queryKey: LEADERBOARD_KEY });
		},
	});
}

/** Buys the next level of an upgrade, or a look (put to use at once). The server checks the price. */
export function usePurchaseMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			purchase:
				| { kind: "upgrade"; item: IUpgradeId }
				| { kind: "skin"; item: ISkinId }
				| { kind: "batter"; item: IBatterId },
		) => toProgress(await apiClient.post<IProgressResponse>("/elf-fling/purchases", purchase)),
		onSuccess: (progress) => queryClient.setQueryData(PROGRESS_KEY, progress),
	});
}

/** Puts an owned look to use. */
export function useLooksMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (looks: { skin?: ISkinId; batter?: IBatterId }) =>
			toProgress(await apiClient.patch<IProgressResponse>("/elf-fling/progress/looks", looks)),
		onSuccess: (progress) => queryClient.setQueryData(PROGRESS_KEY, progress),
	});
}

/** Brings this browser's progress from before accounts over to the player's account (once). */
export function useImportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (device: {
			coins: number;
			upgrades: Partial<IUpgrades>;
			skins: ISkinId[];
			batters: IBatterId[];
			bestDistance: number | null;
		}) =>
			toProgress(
				await apiClient.post<IProgressResponse>("/elf-fling/progress/import", {
					coins: device.coins,
					upgrades: device.upgrades,
					skins: device.skins,
					batters: device.batters,
					best_distance: device.bestDistance,
				}),
			),
		onSuccess: (progress) => {
			queryClient.setQueryData(PROGRESS_KEY, progress);
			queryClient.invalidateQueries({ queryKey: LEADERBOARD_KEY });
		},
	});
}

export function useLeaderboardQuery(board: ILeaderboardBoard, period: ILeaderboardPeriod) {
	return useQuery({
		queryKey: [...LEADERBOARD_KEY, board, period],
		queryFn: async (): Promise<ILeaderboard> => {
			const response = await apiClient.get<ILeaderboardResponse>(
				`/elf-fling/leaderboard?board=${board}&period=${period}`,
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
		// Others' throws land in the background; check in now and then while the page is open.
		refetchInterval: 60_000,
	});
}
