import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Alert, Button, Group, Stack, Text as MantineText, Title } from "@mantine/core";
import { startSleighBellAmbience } from "Components/ElfFling/sound";
import classes from "Components/ElfFling/ElfFling.module.less";

type IWrapUpHoldProps = {
	coins: number;
	/** What the coins make (prestigeGems in upgrades.ts). */
	gems: number;
	/** Which Christmas comes next: 2 after the first wrap-up, and so on. */
	nextChristmas: number;
	soundOn: boolean;
	busy: boolean;
	error: string | null;
	onConfirm: () => void;
	onCancel: () => void;
};

/** How long to hold, in seconds. Matches the ring's animation in ElfFling.module.less. */
const HOLD_SECONDS = 2;

/**
 * Wrapping up Christmas, over the game (so it works in full screen): what's being swapped, and
 * a round button to press and hold while a gold ring fills, with soft sleigh bells. Letting go
 * early backs out; so do "Not yet" and Escape. The ring finishing is what confirms.
 */
export default function WrapUpHold({
	coins,
	gems,
	nextChristmas,
	soundOn,
	busy,
	error,
	onConfirm,
	onCancel,
}: IWrapUpHoldProps) {
	const [holding, setHolding] = useState(false);
	const stopBellsRef = useRef<(() => void) | null>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const stop = () => {
		setHolding(false);
		stopBellsRef.current?.();
		stopBellsRef.current = null;
	};

	const start = () => {
		if (busy || holding) {
			return;
		}

		setHolding(true);

		if (soundOn) {
			stopBellsRef.current = startSleighBellAmbience(HOLD_SECONDS);
		}
	};

	// Focus starts on the hold button, so a keyboard can hold Space or Enter straight away (the
	// game ignores keys while this is open). Closing mid-hold stops the bells.
	useEffect(() => {
		buttonRef.current?.focus();

		return () => stopBellsRef.current?.();
	}, []);

	const holdKeys = (event: KeyboardEvent, press: boolean) => {
		if (event.key !== " " && event.key !== "Enter") {
			return;
		}

		event.preventDefault();

		if (press && !event.repeat) {
			start();
		} else if (!press) {
			stop();
		}
	};

	return (
		<div
			className={classes.wrapUp}
			role="dialog"
			aria-modal="true"
			aria-labelledby="wrap-up-title"
			onKeyDown={(event) => event.key === "Escape" && onCancel()}
		>
			<Stack className={classes.wrapUpCard} gap="xs" align="center">
				<Title order={2} size="h4" id="wrap-up-title">
					Wrap up Christmas?
				</Title>
				<MantineText size="sm" ta="center">
					Swap {coins.toLocaleString()} coins for {gems.toLocaleString()} {gems === 1 ? "gem" : "gems"} and start
					Christmas {nextChristmas}. Coins and coin-shop upgrades start over; gem-shop upgrades and looks stay.
				</MantineText>
				{error && (
					<Alert color="red" w="100%">
						{error}
					</Alert>
				)}
				<Group gap="md" justify="center" wrap="nowrap">
					<Button variant="subtle" color="gray" size="xs" disabled={busy} onClick={onCancel}>
						Not yet
					</Button>
					<button
						ref={buttonRef}
						type="button"
						className={classes.holdButton}
						data-holding={holding || undefined}
						disabled={busy}
						aria-label={busy ? "Wrapping up Christmas" : "Hold to wrap up Christmas"}
						onPointerDown={(event) => {
							event.preventDefault();
							start();
						}}
						onPointerUp={stop}
						onPointerLeave={stop}
						onPointerCancel={stop}
						onContextMenu={(event) => event.preventDefault()}
						onKeyDown={(event) => holdKeys(event, true)}
						onKeyUp={(event) => holdKeys(event, false)}
					>
						<svg viewBox="0 0 100 100" aria-hidden="true">
							<circle className={classes.holdTrack} cx="50" cy="50" r="44" />
							<circle
								className={classes.holdRing}
								cx="50"
								cy="50"
								r="44"
								onAnimationEnd={() => {
									stop();
									onConfirm();
								}}
							/>
						</svg>
						<span className={classes.holdLabel}>{busy ? "..." : "Hold"}</span>
					</button>
				</Group>
			</Stack>
		</div>
	);
}
