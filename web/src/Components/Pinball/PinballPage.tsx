import { useRef, useState } from "react";
import { ActionIcon, Alert, Button, Group, Stack, Text as MantineText, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompress, faExpand, faRotateRight, faVolumeHigh, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import LoadingText from "Components/Common/LoadingText";
import ElfFlingLeaderboard from "Components/ElfFling/ElfFlingLeaderboard";
import SectionCard from "Components/Common/SectionCard";
import { usePinballScoreMutation, useProgressQuery } from "Components/ElfFling/hooks";
import { readSoundOn, saveSoundOn, wakeAudio } from "Components/ElfFling/sound";
import { useFullscreen } from "Components/ElfFling/useFullscreen";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import { useWakeLock } from "Components/ElfFling/useWakeLock";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import PinballGame, { turnFor } from "Components/Pinball/PinballGame";
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
						<>
							<PinballPlay best={progressQuery.data.pinballBest} />
							<ElfFlingLeaderboard boards={["pinball"]} />
						</>
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
	// Full screen, upright where the phone allows it; held sideways anyway, the table turns to fill it.
	const stageRef = useRef<HTMLDivElement>(null);
	const { fullscreen, enter, exit } = useFullscreen(stageRef, "portrait");
	const touchScreen = useTouchScreen();
	const portrait = useMediaQuery("(orientation: portrait)");
	const turn = fullscreen ? turnFor(touchScreen && portrait === false) : 0;
	useWakeLock(fullscreen && touchScreen);

	const playAgain = () => {
		setFinalScore(null);
		setRound((current) => current + 1);
	};

	return (
		<Stack gap="sm">
			<Group justify="space-between" wrap="nowrap" align="flex-start">
				<MantineText size="sm">
					Hold Space to pull the plunger back, and let go to launch. Flip with the left and right arrow keys (or Z and
					M), or Space for both. Nudge the table with X, full stop and the up arrow, but not too much. On a phone, press
					and let go to launch, then press the left or right half to flip.
				</MantineText>
				<Stack gap={4} style={{ flex: "none" }}>
					<Button
						variant="subtle"
						size="xs"
						leftSection={<FontAwesomeIcon icon={faExpand} />}
						onClick={(event) => {
							enter();
							event.currentTarget.blur();
						}}
					>
						Full screen
					</Button>
					<Button
						variant="subtle"
						size="xs"
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
				</Stack>
			</Group>
			<div ref={stageRef} className={fullscreen ? `${classes.page} ${classes.fullscreen}` : classes.page}>
				<PinballGame
					key={round}
					soundOn={soundOn}
					turn={turn}
					onGameOver={(score) => {
						setFinalScore({ score, newBest: score > best && score > 0 });
						saveScore.mutate(score);
					}}
				/>
				{fullscreen && (
					<>
						<Tooltip label="Leave full screen (Esc)" withArrow disabled={touchScreen}>
							<ActionIcon
								variant="transparent"
								radius="xl"
								size={touchScreen ? 48 : 40}
								className={classes.leaveFullscreen}
								aria-label="Leave full screen"
								onClick={exit}
							>
								<FontAwesomeIcon icon={faCompress} />
							</ActionIcon>
						</Tooltip>
						{/* The page's game-over line and button are hidden behind, so they show over the table. */}
						{finalScore !== null && (
							<div className={classes.gameOver} aria-live="polite">
								<MantineText fw={700}>
									Game over: {finalScore.score.toLocaleString()} points
									{finalScore.newBest ? ". A new best!" : "."}
								</MantineText>
								<Button leftSection={<FontAwesomeIcon icon={faRotateRight} />} onClick={playAgain}>
									Play again
								</Button>
							</div>
						)}
					</>
				)}
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
					<Button leftSection={<FontAwesomeIcon icon={faRotateRight} />} onClick={playAgain}>
						Play again
					</Button>
				)}
			</Group>
		</Stack>
	);
}
