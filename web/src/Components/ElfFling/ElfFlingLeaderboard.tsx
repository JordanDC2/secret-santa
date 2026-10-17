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
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/ElfFling/ElfFling.module.less";

/** Short labels on phones, so the three tabs fit on one row (a Galaxy Z Fold's cover screen is 344px). */
const BOARDS: { value: ILeaderboardBoard; label: string; short: string }[] = [
	{ value: "distance", label: "Best distance", short: "Distance" },
	{ value: "coins", label: "Most coins", short: "Coins" },
	{ value: "swings", label: "Most swings", short: "Swings" },
];

const PERIODS: { value: ILeaderboardPeriod; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: "all", label: "All time" },
];

/** After switching, Space and Enter go back to the game, not to this switch (see releaseFocus.ts). */
function letGoOfFocus() {
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}

function formatValue(board: ILeaderboardBoard, value: number): string {
	switch (board) {
		case "distance":
			return `${value.toFixed(1)} m`;
		case "coins":
			return `${value.toLocaleString()} ${value === 1 ? "coin" : "coins"}`;
		default:
			return `${value.toLocaleString()} ${value === 1 ? "swing" : "swings"}`;
	}
}

/**
 * Everyone on the site, ranked by best distance, most coins earned or most swings taken, this week (from Monday)
 * or all time. Names are first name and last initial; your own row is highlighted, and your
 * rank shows below even if you're outside the top. Updates live as anyone finishes a throw.
 */
export default function ElfFlingLeaderboard() {
	const [board, setBoard] = useState<ILeaderboardBoard>("distance");
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
			<Tabs
				// Festive gold: the theme's green underline disappears against the dark-mode card.
				color="var(--festive-gold-deep)"
				classNames={{ tab: classes.boardTab }}
				value={board}
				onChange={(value) => {
					if (value) {
						setBoard(value as ILeaderboardBoard);
						letGoOfFocus();
					}
				}}
			>
				<Tabs.List grow>
					{BOARDS.map((option) => (
						<Tabs.Tab key={option.value} value={option.value}>
							<Box component="span" visibleFrom="xs">
								{option.label}
							</Box>
							<Box component="span" hiddenFrom="xs">
								{option.short}
							</Box>
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs>
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
				{period === "week" ? "No throws yet this week. Be the first!" : "No throws yet. Be the first!"}
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
