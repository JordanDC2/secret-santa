import { useState } from "react";
import { Alert, Button, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight, faVolumeHigh, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import LoadingText from "Components/Common/LoadingText";
import SectionCard from "Components/Common/SectionCard";
import { usePinballScoreMutation, useProgressQuery } from "Components/ElfFling/hooks";
import { readSoundOn, saveSoundOn, wakeAudio } from "Components/ElfFling/sound";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import PinballGame from "Components/Pinball/PinballGame";
import classes from "Components/Pinball/Pinball.module.less";
import { apiErrorMessage } from "Data/Api/Client";

/**
 * Christmas pinball as a game of its own: Elf Fling's secret level, unlocked by finding a
 * chimney there. The player's best score is kept with their account.
 */
export default function PinballPage() {
	const progressQuery = useProgressQuery();

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups to="/games" label="Back to games" />
				<PageTitle icon={<GiftBoxIcon />}>Christmas pinball</PageTitle>
				{progressQuery.isError && <Alert color="red">{apiErrorMessage(progressQuery.error)}</Alert>}
				{progressQuery.isPending && <LoadingText>Loading pinball...</LoadingText>}
				{progressQuery.data &&
					(progressQuery.data.pinballUnlocked ? (
						<PinballPlay best={progressQuery.data.pinballBest} />
					) : (
						<SectionCard title="Not found yet">
							<MantineText size="sm">
								This one&apos;s hidden down a chimney in Elf Fling. Find it there and it&apos;s yours to play here
								whenever you like.
							</MantineText>
							<Button component={Link} to="/games/elf-fling" variant="secondary" size="xs" w="fit-content">
								Play Elf Fling
							</Button>
						</SectionCard>
					))}
			</Stack>
		</Page>
	);
}

function PinballPlay({ best }: { best: number }) {
	const [round, setRound] = useState(0);
	// The last game's score, and whether it beat the best as it stood before it was saved.
	const [finalScore, setFinalScore] = useState<{ score: number; newBest: boolean } | null>(null);
	const [soundOn, setSoundOn] = useState(readSoundOn);
	const saveScore = usePinballScoreMutation();

	return (
		<Stack gap="sm">
			<Group justify="space-between" wrap="nowrap">
				<MantineText size="sm">
					Flip with the left and right arrow keys (or Z and M), or Space for both. On a phone, press the left or right
					half.
				</MantineText>
				<Button
					variant="subtle"
					size="xs"
					style={{ flex: "none" }}
					leftSection={<FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} />}
					onClick={(event) => {
						if (!soundOn) {
							wakeAudio();
						}

						saveSoundOn(!soundOn);
						setSoundOn(!soundOn);
						event.currentTarget.blur();
					}}
				>
					{soundOn ? "Sound on" : "Sound off"}
				</Button>
			</Group>
			<div className={classes.page}>
				<PinballGame
					key={round}
					soundOn={soundOn}
					onGameOver={(score) => {
						setFinalScore({ score, newBest: score > best && score > 0 });
						saveScore.mutate(score);
					}}
				/>
			</div>
			<Group justify="space-between" align="center">
				<div aria-live="polite">
					{finalScore !== null && (
						<MantineText fw={700}>
							Game over: {finalScore.score.toLocaleString()} points
							{finalScore.newBest ? ". A new best!" : "."}
						</MantineText>
					)}
					<MantineText size="sm" c="dimmed">
						Your best: {best > 0 ? best.toLocaleString() : "none yet"}
					</MantineText>
					{saveScore.isError && (
						<MantineText size="sm" c="red">
							That score couldn&apos;t be saved. Check your connection.
						</MantineText>
					)}
				</div>
				{finalScore !== null && (
					<Button
						leftSection={<FontAwesomeIcon icon={faRotateRight} />}
						onClick={() => {
							setFinalScore(null);
							setRound((current) => current + 1);
						}}
					>
						Play again
					</Button>
				)}
			</Group>
		</Stack>
	);
}
