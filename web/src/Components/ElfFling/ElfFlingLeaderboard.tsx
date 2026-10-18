import { useState } from "react";
import { Alert, Box, Group, SegmentedControl, Stack, Table, Tabs, Text as MantineText } from "@mantine/core";
import SectionCard from "Components/Common/SectionCard";
import LoadingText from "Components/Common/LoadingText";
import ElfFlingLiveUpdates from "Components/ElfFling/ElfFlingLiveUpdates";
import {
	useLeaderboardQuery,
	type ILeaderboard,
	type ILeaderboardBoard,
	type ILeaderboardPeriod,
} from "Components/ElfFling/hooks";
import { letGoOfFocus } from "Components/ElfFling/releaseFocus";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/ElfFling/ElfFling.module.less";

/** Short labels on phones, so the tabs fit on one row (a Galaxy Z Fold's cover screen is 344px). */
const BOARDS: Record<ILeaderboardBoard, { label: string; short: string }> = {
	distance: { label: "Best distance", short: "Distance" },
	score: { label: "Best score", short: "Score" },
	coins: { label: "Most coins", short: "Coins" },
	swings: { label: "Most swings", short: "Swings" },
	pinball: { label: "Best score", short: "Score" },
};
const ELF_FLING_BOARDS: ILeaderboardBoard[] = ["distance", "score", "coins", "swings"];

const PERIODS: { value: ILeaderboardPeriod; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: "all", label: "All time" },
];

function formatValue(board: ILeaderboardBoard, value: number): string {
	switch (board) {
		case "distance":
			return `${value.toFixed(1)} m`;
		case "score":
		case "pinball":
			return value.toLocaleString();
		case "coins":
			return `${value.toLocaleString()} ${value === 1 ? "coin" : "coins"}`;
		default:
			return `${value.toLocaleString()} ${value === 1 ? "swing" : "swings"}`;
	}
}

/**
 * Everyone on the site, ranked by best distance, most coins earned or most swings taken, this week (from Monday)
 * or all time; or, given just the pinball board, by best pinball score. Names are first name and
 * last initial; your own row is highlighted, and your rank shows below even if you're outside
 * the top. Updates live as anyone finishes a throw or a game. Tabs only with more than one board.
 */
export default function ElfFlingLeaderboard({ boards = ELF_FLING_BOARDS }: { boards?: ILeaderboardBoard[] }) {
	const [board, setBoard] = useState<ILeaderboardBoard>(boards[0]);
	const [period, setPeriod] = useState<ILeaderboardPeriod>("week");
	const query = useLeaderboardQuery(board, period);

	return (
		<SectionCard
			title="Leaderboard"
			action={
				<SegmentedControl
					size="xs"
					data={PERIODS}
					value={period}
					onChange={(value) => {
						setPeriod(value as ILeaderboardPeriod);
						letGoOfFocus();
					}}
					aria-label="Which period"
				/>
			}
		>
			{boards.length > 1 && (
				<Tabs
					// Festive gold: the theme's green underline disappears against the dark-mode card.
					color="var(--festive-gold-deep)"
					classNames={{ tab: classes.festiveTab }}
					value={board}
					onChange={(value) => {
						if (value) {
							setBoard(value as ILeaderboardBoard);
							letGoOfFocus();
						}
					}}
				>
					<Tabs.List grow>
						{boards.map((option) => (
							<Tabs.Tab key={option} value={option}>
								<Box component="span" visibleFrom="xs">
									{BOARDS[option].label}
								</Box>
								<Box component="span" hiddenFrom="xs">
									{BOARDS[option].short}
								</Box>
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs>
			)}
			<ElfFlingLiveUpdates />
			{query.isPending && <LoadingText>Loading the leaderboard...</LoadingText>}
			{query.isError && <Alert color="red">{apiErrorMessage(query.error)}</Alert>}
			{query.data && <Standings board={board} period={period} leaderboard={query.data} />}
		</SectionCard>
	);
}

function Standings({
	board,
	period,
	leaderboard,
}: {
	board: ILeaderboardBoard;
	period: ILeaderboardPeriod;
	leaderboard: ILeaderboard;
}) {
	if (leaderboard.entries.length === 0) {
		return (
			<MantineText size="sm" c="dimmed">
				{board === "pinball"
					? period === "week"
						? "No games yet this week. Be the first!"
						: "No games yet. Be the first!"
					: period === "week"
						? "No throws yet this week. Be the first!"
						: "No throws yet. Be the first!"}
			</MantineText>
		);
	}

	const youOutsideTop = leaderboard.you && !leaderboard.entries.some((entry) => entry.isYou);

	return (
		<Stack gap="xs">
			<Table verticalSpacing={6}>
				<Table.Tbody>
					{leaderboard.entries.map((entry) => (
						<Table.Tr key={`${entry.rank}-${entry.name}`} className={entry.isYou ? classes.yourRow : undefined}>
							<Table.Td w={40} c="dimmed">
								{entry.rank}
							</Table.Td>
							<Table.Td fw={entry.isYou ? 800 : 500}>
								{entry.name}
								{entry.isYou && " (you)"}
							</Table.Td>
							<Table.Td ta="right" fw={700}>
								{formatValue(board, entry.value)}
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			{youOutsideTop && leaderboard.you && (
				<Group justify="space-between" className={classes.yourRow} px="sm" py={6}>
					<MantineText size="sm" fw={800}>
						You: #{leaderboard.you.rank}
					</MantineText>
					<MantineText size="sm" fw={700}>
						{formatValue(board, leaderboard.you.value)}
					</MantineText>
				</Group>
			)}
		</Stack>
	);
}
