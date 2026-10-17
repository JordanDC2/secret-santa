import { useCallback, useState } from "react";
import { Button, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import ElfFlingGame from "Components/ElfFling/ElfFlingGame";
import ElfFlingShop from "Components/ElfFling/ElfFlingShop";
import { readBestThrow, saveBestThrow } from "Components/ElfFling/bestThrow";
import type { IGameState, IPhase } from "Components/ElfFling/physics";
import { readProgress, saveProgress, type IProgress } from "Components/ElfFling/progress";
import type { IUpgradeId } from "Components/ElfFling/upgrades";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";

type IResult = { message: string; coins: number; newBest: boolean };

const PROMPTS: Record<Exclude<IPhase, "done">, string> = {
	ready: "Tap the game (or press Space) to send the elf hopping off the presents.",
	dropping: "Now tap to swing!",
	flying: "Wheee!",
	sliding: "Wheee!",
};

function describe(state: IGameState): string {
	const metres = `${(state.distance ?? 0).toFixed(1)} m`;
	const crackers =
		state.pops === 0 ? "" : ` and popped ${state.pops} ${state.pops === 1 ? "cracker" : "crackers"} on the way`;

	switch (state.outcome) {
		case "perfect":
			return `Perfect swing! The elf flew ${metres}${crackers}.`;
		case "hit":
			return `The elf flew ${metres}${crackers}.`;
		case "miss":
			return "Swing and a miss! The elf landed in the snow.";
		default:
			return "Too late! The elf landed in the snow before the swing.";
	}
}

/**
 * Elf Fling: a reindeer bats a little elf as far as it can, collecting coins to spend in the
 * shop. The best throw, coins and upgrades are kept per device.
 */
export default function ElfFlingPage() {
	const [round, setRound] = useState(0);
	const [phase, setPhase] = useState<IPhase>("ready");
	const [result, setResult] = useState<IResult | null>(null);
	const [best, setBest] = useState(readBestThrow);
	const [progress, setProgress] = useState(readProgress);
	const [jumpUsed, setJumpUsed] = useState(false);

	const updateProgress = useCallback((change: (current: IProgress) => IProgress) => {
		setProgress((current) => {
			const next = change(current);
			saveProgress(next);

			return next;
		});
	}, []);

	const handleFinish = useCallback(
		(state: IGameState) => {
			const distance = state.distance ?? 0;
			const previousBest = readBestThrow() ?? 0;
			const newBest = distance > previousBest;

			if (newBest) {
				saveBestThrow(distance);
				setBest(distance);
			}

			if (state.coinsCollected > 0) {
				updateProgress((current) => ({ ...current, coins: current.coins + state.coinsCollected }));
			}

			setResult({ message: describe(state), coins: state.coinsCollected, newBest });
		},
		[updateProgress],
	);

	const throwAgain = useCallback(() => {
		setResult(null);
		setPhase("ready");
		setJumpUsed(false);
		setRound((current) => current + 1);
	}, []);

	// Upgrades count from the next throw; one bought before the elf has hopped applies straight away.
	const buy = useCallback(
		(id: IUpgradeId, price: number) => {
			updateProgress((current) =>
				current.coins < price
					? current
					: {
							coins: current.coins - price,
							upgrades: { ...current.upgrades, [id]: current.upgrades[id] + 1 },
						},
			);

			if (phase === "ready") {
				setRound((current) => current + 1);
			}
		},
		[phase, updateProgress],
	);

	const airborne = phase === "flying" || phase === "sliding";
	const offerJump = airborne && progress.upgrades.elfJump > 0 && !jumpUsed;
	const prompt =
		phase === "done" && result
			? result.message
			: offerJump
				? "Tap to give the elf a jump!"
				: PROMPTS[phase === "done" ? "ready" : phase];

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups to="/games" label="Back to games" />
				<PageTitle icon={<GiftBoxIcon />}>Elf Fling</PageTitle>
				<MantineText>
					The elf hops off the presents; swing the candy cane as it falls past. Hit it right on the sweet spot to send
					it flying, and grab the coins on the way to spend in the shop.
				</MantineText>
				<ElfFlingGame
					key={round}
					upgrades={progress.upgrades}
					best={best}
					onPhaseChange={setPhase}
					onFinish={handleFinish}
					onJump={() => setJumpUsed(true)}
					onRestart={throwAgain}
				/>
				<Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
					<div aria-live="polite" style={{ flex: 1, minWidth: 0 }}>
						<MantineText fw={700}>{prompt}</MantineText>
						{phase === "done" && result && result.coins > 0 && (
							<MantineText size="sm" fw={700} c="var(--festive-gold-text)">
								+{result.coins} {result.coins === 1 ? "coin" : "coins"}
							</MantineText>
						)}
						{phase === "done" && result?.newBest && (
							<MantineText size="sm" c="green" fw={700}>
								That&apos;s a new best!
							</MantineText>
						)}
						<MantineText size="sm" c="dimmed">
							Best on this device: {best ? `${best.toFixed(1)} m` : "none yet"}
						</MantineText>
					</div>
					{phase === "done" && (
						<Button
							leftSection={<FontAwesomeIcon icon={faRotateRight} />}
							onClick={throwAgain}
							style={{ flex: "none" }}
						>
							Throw again
						</Button>
					)}
				</Group>
				<ElfFlingShop coins={progress.coins} upgrades={progress.upgrades} onBuy={buy} />
			</Stack>
		</Page>
	);
}
