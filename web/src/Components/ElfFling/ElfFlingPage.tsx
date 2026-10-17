import { useCallback, useState } from "react";
import { Button, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import ElfFlingGame from "Components/ElfFling/ElfFlingGame";
import { readBestThrow, saveBestThrow } from "Components/ElfFling/bestThrow";
import type { IGameState, IPhase } from "Components/ElfFling/physics";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";

type IResult = { message: string; newBest: boolean };

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

/** Elf Fling: a reindeer bats a little elf as far as it can. Best throw is kept per device. */
export default function ElfFlingPage() {
	const [round, setRound] = useState(0);
	const [phase, setPhase] = useState<IPhase>("ready");
	const [result, setResult] = useState<IResult | null>(null);
	const [best, setBest] = useState(readBestThrow);

	const handleFinish = useCallback((state: IGameState) => {
		const distance = state.distance ?? 0;
		const previousBest = readBestThrow() ?? 0;
		const newBest = distance > previousBest;

		if (newBest) {
			saveBestThrow(distance);
			setBest(distance);
		}

		setResult({ message: describe(state), newBest });
	}, []);

	const throwAgain = useCallback(() => {
		setResult(null);
		setPhase("ready");
		setRound((current) => current + 1);
	}, []);

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups to="/games" label="Back to games" />
				<PageTitle icon={<GiftBoxIcon />}>Elf Fling</PageTitle>
				<MantineText>
					The elf hops off the presents; swing the candy cane as it falls past. Hit it right on the sweet spot to send
					it flying, and if it lands on a Christmas cracker, bang! Off it goes again.
				</MantineText>
				<ElfFlingGame key={round} best={best} onPhaseChange={setPhase} onFinish={handleFinish} onRestart={throwAgain} />
				<Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
					<div aria-live="polite">
						<MantineText fw={700}>
							{phase === "done" && result ? result.message : PROMPTS[phase === "done" ? "ready" : phase]}
						</MantineText>
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
						<Button leftSection={<FontAwesomeIcon icon={faRotateRight} />} onClick={throwAgain}>
							Throw again
						</Button>
					)}
				</Group>
			</Stack>
		</Page>
	);
}
