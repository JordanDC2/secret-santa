import { useState } from "react";
import { Alert, Box, Group, SegmentedControl, Stack, Table, Tabs, Text as MantineText } from "@mantine/core";
import LoadingText from "Components/Common/LoadingText";
import SectionCard from "Components/Common/SectionCard";
import { letGoOfFocus } from "Components/ElfFling/releaseFocus";
import { NIGHT_SECONDS } from "Components/SilentNight/constants";
import {
	useLeaderboardQuery,
	type ILeaderboard,
	type ILeaderboardBoard,
	type ILeaderboardPeriod,
} from "Components/SilentNight/hooks";
import { clock } from "Components/SilentNight/NightOver";
import { apiErrorMessage } from "Data/Api/Client";
import elfFlingClasses from "Components/ElfFling/ElfFling.module.less";

/** Short labels on phones, so the tabs fit on one row. */
const BOARDS: Array<{ value: ILeaderboardBoard; label: string; short: string }> = [
	{ value: "night", label: "Longest night", short: "Night" },
	{ value: "krampus", label: "Krampus beaten", short: "Krampus" },
	{ value: "kills", label: "Most broken", short: "Broken" },
];

const PERIODS: { value: ILeaderboardPeriod; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: "all", label: "All time" },
];

function formatValue(board: ILeaderboardBoard, value: number): string {
	switch (board) {
		case "night":
			return value >= NIGHT_SECONDS ? "Till dawn" : clock(value);
		case "krampus":
			return value === 0 ? "No bargains" : `${value} ${value === 1 ? "bargain" : "bargains"}`;
		default:
			return value.toLocaleString();
	}
}

/**
 * Everyone on the site, ranked by their longest night, the most of Krampus's bargains they've
 * taken and still beaten him, or the most broken in a night; this week (from Monday) or all time.
 * Names are first name and last initial; your own row is highlighted, and your rank shows below
 * even if you're outside the top.
 */
export default function SilentNightLeaderboard() {
	const [board, setBoard] = useState<ILeaderboardBoard>("night");
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
				color="var(--festive-gold-deep)"
				classNames={{ tab: elfFlingClasses.festiveTab }}
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
				{board === "krampus"
					? "No one's beaten Krampus yet. Be the first!"
					: period === "week"
						? "No nights yet this week. Be the first!"
						: "No nights yet. Be the first!"}
			</MantineText>
		);
	}

	const youOutsideTop = leaderboard.you && !leaderboard.entries.some((entry) => entry.isYou);

	return (
		<Stack gap="xs">
			<Table verticalSpacing={6}>
				<Table.Tbody>
					{leaderboard.entries.map((entry) => (
						<Table.Tr key={`${entry.rank}-${entry.name}`} className={entry.isYou ? elfFlingClasses.yourRow : undefined}>
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
				<Group justify="space-between" className={elfFlingClasses.yourRow} px="sm" py={6}>
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
