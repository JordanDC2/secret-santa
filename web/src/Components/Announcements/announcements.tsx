import type { ReactNode } from "react";
import { List, Stack, Text as MantineText } from "@mantine/core";
import BulletList from "Components/Common/BulletList";
import Podium, { type IPodiumPlace } from "Components/Announcements/Podium";

/**
 * Announcements: release notes shown once on each device (Announcement.tsx), on the pages each
 * names. A page's newest shows, with the earlier ones under it. Listed newest first: add one at
 * the top, with a new, never-reused id and the time it went live.
 */
export type IAnnouncement = {
	id: string;
	/** When it went live, as an ISO 8601 time (shown in the reader's own time zone). */
	released: string;
	/** The pages it shows on. */
	paths: string[];
	title: string;
	content: ReactNode;
	/** The button that closes it; "Got it" if not given. */
	button?: string;
};

/** Elf Fling's leaderboards (all time) as they stood when the update went live. */
const FINAL_STANDINGS: Array<{ title: string; places: IPodiumPlace[] }> = [
	{
		title: "Best distance",
		places: [
			{ name: "Brandon C.", value: "1,766.6 m" },
			{ name: "Selena C.", value: "1,589.2 m" },
			{ name: "Mitch C.", value: "1,584.2 m" },
		],
	},
	{
		title: "Most coins",
		places: [
			{ name: "Barrett C.", value: "42,908 coins" },
			{ name: "Brandon C.", value: "30,390 coins" },
			{ name: "Selena C.", value: "26,418 coins" },
		],
	},
	{
		title: "Most swings",
		places: [
			{ name: "Barrett C.", value: "270 swings" },
			{ name: "Mitch C.", value: "181 swings" },
			{ name: "Selena C.", value: "152 swings" },
		],
	},
];

export const ANNOUNCEMENTS: IAnnouncement[] = [
	{
		id: "elf-fling-new-horizons",
		released: "2026-10-19T13:48:00Z",
		paths: ["/games/elf-fling"],
		title: "New in Elf Fling: past the sunset",
		content: (
			<Stack gap="md">
				<MantineText size="sm">Here&apos;s what&apos;s new:</MantineText>
				<BulletList size="sm">
					<List.Item>
						New places to explore: the first three times the sun sets on a run, the course heads somewhere new. How far
						can you get?
					</List.Item>
					<List.Item>The snowy hills, where every run starts, have been redrawn.</List.Item>
					<List.Item>
						Power-ups, course features, crackers, sky ornaments and the sleigh can be switched off and on again in the
						shop.
					</List.Item>
					<List.Item>
						Can&apos;t find the secret level? Its game on the Games page can now be unlocked anyway.
					</List.Item>
					<List.Item>On phones, the screen stays on while you play in full screen.</List.Item>
					<List.Item>The sun rises instead of appearing, and the distance markers no longer flicker.</List.Item>
				</BulletList>
			</Stack>
		),
		button: "Let's go",
	},
	{
		id: "elf-fling-high-sky",
		released: "2026-10-19T01:18:32Z",
		paths: ["/games/elf-fling"],
		title: "New in Elf Fling: the high sky",
		content: (
			<Stack gap="md">
				<MantineText size="sm">Here&apos;s what&apos;s new:</MantineText>
				<BulletList size="sm">
					<List.Item>
						The high sky: far above the course, coins worth 10 and 25, with the odd ornament and power-up. Get up there
						on an updraft or a huge launch.
					</List.Item>
					<List.Item>
						With high winds, a jet stream up there pushes you onward instead of letting you slow down.
					</List.Item>
					<List.Item>Updrafts are a little rarer.</List.Item>
					<List.Item>
						The secret level is one ball now, and the better you do, the harder you shoot back out and the more your
						coins so far are multiplied.
					</List.Item>
					<List.Item>Your speed shows under the distance.</List.Item>
				</BulletList>
			</Stack>
		),
	},
	{
		id: "elf-fling-christmas-update",
		released: "2026-10-18T18:04:35Z",
		paths: ["/games/elf-fling"],
		title: "Elf Fling's Christmas update",
		content: (
			<Stack gap="md">
				<MantineText size="sm">Here&apos;s what&apos;s new:</MantineText>
				<BulletList size="sm">
					<List.Item>
						Gems: wrap up Christmas in the shop to turn your coins into gems, for upgrades that you keep.
					</List.Item>
					<List.Item>
						To unlock with gems: power-ups on the course (the Christmas star, gingerbread man, snow angel wings, giant
						snowball, north wind, hot cocoa, spare firework and Yule log cannons), high winds and updrafts, and
						chimneys.
					</List.Item>
					<List.Item>A secret level, somewhere out on the course. Can you find it?</List.Item>
					<List.Item>A day and night cycle, and a course that never ends.</List.Item>
					<List.Item>
						A score for every throw, a Best score leaderboard, and a summary at the end of each run.
					</List.Item>
					<List.Item>And many more smaller changes and improvements.</List.Item>
				</BulletList>
				<MantineText size="sm" fw={700}>
					Final standings before the update
				</MantineText>
				{FINAL_STANDINGS.map((board) => (
					<Podium key={board.title} title={board.title} places={board.places} />
				))}
			</Stack>
		),
		button: "Let's play",
	},
];
