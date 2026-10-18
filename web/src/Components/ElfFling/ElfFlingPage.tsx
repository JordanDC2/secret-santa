import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Button, Drawer, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import LoadingText from "Components/Common/LoadingText";
import ElfFlingGame from "Components/ElfFling/ElfFlingGame";
import ElfFlingLeaderboard from "Components/ElfFling/ElfFlingLeaderboard";
import ElfFlingShop, { Balances } from "Components/ElfFling/ElfFlingShop";
import {
	useImportMutation,
	useLooksMutation,
	usePrestigeMutation,
	useProgressQuery,
	usePurchaseMutation,
	useRecordThrowMutation,
} from "Components/ElfFling/hooks";
import type { IGameState, IPhase } from "Components/ElfFling/physics";
import { forgetDeviceProgress, readDeviceProgress, type IProgress } from "Components/ElfFling/progress";
import { capitalised, skinById, type IBatterId, type ISkinId } from "Components/ElfFling/skins";
import { combinedUpgrades, type IUpgradeId } from "Components/ElfFling/upgrades";
import { playGem, readSoundOn, saveSoundOn, wakeAudio } from "Components/ElfFling/sound";
import { useFullscreen } from "Components/ElfFling/useFullscreen";
import { releaseFocus } from "Components/ElfFling/releaseFocus";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import classes from "Components/ElfFling/ElfFling.module.less";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import { apiErrorMessage } from "Data/Api/Client";

/** A finished throw's outcome. Coins are filled in once the server has banked them. */
type IResult = {
	message: string;
	banked: { coins: number; bonus: number; newBest: boolean } | null;
	saveFailed: boolean;
};

const INTRO =
	"The elf hops off the presents; swing the candy cane as it falls past. Hit it right on the sweet spot to send it flying, and grab the coins on the way to spend in the shop.";

/** Prompts while the throw is under way; the ready one names the flyer, so it's in the component. */
const PROMPTS: Record<Exclude<IPhase, "done" | "ready">, string> = {
	dropping: "Now tap to swing!",
	flying: "Wheee!",
	sliding: "Wheee!",
};

/** "1 cracker", "3 crackers". */
function count(n: number, one: string, many: string): string {
	return `${n} ${n === 1 ? one : many}`;
}

/** Where a throw's extra coins came from: "the lucky stocking", "the Christmas bonus", or both. */
function bonusSources(progress: IProgress): string {
	const stocking = progress.upgrades.luckyStocking + progress.gemUpgrades.luckyStocking > 0;
	const christmasBonus = progress.gemUpgrades.christmasBonus > 0;

	return [stocking && "the lucky stocking", christmasBonus && "the Christmas bonus"].filter(Boolean).join(" and ");
}

/** The result line. "subject" is who was flung, mid-sentence: "the elf", "Santa". */
function describe(state: IGameState, subject: string): string {
	const who = capitalised(subject);
	const metres = `${(state.distance ?? 0).toFixed(1)} m`;
	const extras = [
		state.sleigh?.boardedAt != null ? "caught a ride on a sleigh" : null,
		state.pops > 0 ? `popped ${count(state.pops, "cracker", "crackers")}` : null,
		state.smashes > 0 ? `smashed ${count(state.smashes, "ornament", "ornaments")}` : null,
		state.bonks > 0 ? `bumped into ${count(state.bonks, "snowman", "snowmen")}` : null,
	].filter(Boolean);
	const crackers = extras.length === 0 ? "" : `, ${extras.join(", ")}`;

	switch (state.outcome) {
		case "perfect":
			return `Perfect swing! ${who} flew ${metres}${crackers}.`;
		case "hit":
			return `${who} flew ${metres}${crackers}.`;
		case "miss":
			return `Swing and a miss! ${who} landed in the snow.`;
		default:
			return `Too late! ${who} landed in the snow before the swing.`;
	}
}

/**
 * Elf Fling: a reindeer bats a little elf as far as it can, collecting coins to spend in the
 * shop, with site-wide leaderboards. Progress lives with the player's account; a browser's
 * own progress from before that is brought over once.
 */
export default function ElfFlingPage() {
	const progressQuery = useProgressQuery();
	const importDevice = useImportMutation();
	const importStarted = useRef(false);

	// Once per player: bring over what this browser saved before accounts kept it.
	useEffect(() => {
		const progress = progressQuery.data;

		if (!progress || progress.imported || importStarted.current) {
			return;
		}

		const device = readDeviceProgress();

		if (device) {
			importStarted.current = true;
			importDevice.mutate(device, { onSuccess: forgetDeviceProgress });
		}
	}, [progressQuery.data, importDevice]);

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups to="/games" label="Back to games" />
				<PageTitle icon={<GiftBoxIcon />}>Elf Fling</PageTitle>
				{progressQuery.isError && <Alert color="red">{apiErrorMessage(progressQuery.error)}</Alert>}
				{progressQuery.isPending && <LoadingText>Loading Elf Fling...</LoadingText>}
				{progressQuery.data && <ElfFlingPlay progress={progressQuery.data} />}
			</Stack>
		</Page>
	);
}

/** The game, what's happening in it, the leaderboards and the shop, once progress has loaded. */
function ElfFlingPlay({ progress }: { progress: IProgress }) {
	const [round, setRound] = useState(0);
	const [phase, setPhase] = useState<IPhase>("ready");
	const [result, setResult] = useState<IResult | null>(null);
	const [jumps, setJumps] = useState({ available: false, left: 0 });
	const recordThrow = useRecordThrowMutation();
	const purchase = usePurchaseMutation();
	const looks = useLooksMutation();
	const prestige = usePrestigeMutation();
	const touchScreen = useTouchScreen();
	const stageRef = useRef<HTMLDivElement>(null);
	const { fullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen(stageRef);
	const [soundOn, setSoundOn] = useState(readSoundOn);
	const [shopOpen, setShopOpen] = useState(false);
	const skin = skinById(progress.skin);
	// The result is written when a throw ends, inside a callback; it reads the skin from here.
	const skinRef = useRef(progress.skin);
	useLayoutEffect(() => {
		skinRef.current = progress.skin;
	});

	const handleFinish = useCallback(
		(state: IGameState) => {
			const distance = state.distance ?? 0;
			setResult({ message: describe(state, skinById(skinRef.current).subject), banked: null, saveFailed: false });

			// Every throw is saved, misses too: they count on the "most swings" leaderboard.
			recordThrow.mutate(
				{ distance, coinsCollected: state.coinsCollected },
				{
					onSuccess: ({ banked, newBest }) =>
						setResult(
							(current) =>
								current && { ...current, banked: { coins: banked, bonus: banked - state.coinsCollected, newBest } },
						),
					onError: () => setResult((current) => current && { ...current, saveFailed: true }),
				},
			);
		},
		[recordThrow],
	);

	// Off until turned on, and remembered per device. Turning it on is a tap, which lets the browser play sound.
	// The audio wakes inside the tap itself, since browsers only let sound start from one.
	const toggleSound = useCallback(() => {
		const on = !soundOn;

		if (on) {
			wakeAudio();
		}

		saveSoundOn(on);
		setSoundOn(on);
	}, [soundOn]);

	const throwAgain = useCallback(() => {
		setResult(null);
		setPhase("ready");
		setJumps({ available: false, left: 0 });
		setRound((current) => current + 1);
	}, []);

	// Upgrades count from the next throw; one bought before the elf has hopped applies straight away.
	const buy = (id: IUpgradeId) =>
		purchase.mutate(
			{ kind: "upgrade", item: id },
			{ onSuccess: () => phase === "ready" && setRound((current) => current + 1) },
		);
	const buyGemUpgrade = (id: IUpgradeId | "christmasBonus") =>
		purchase.mutate(
			{ kind: "gemUpgrade", item: id },
			{ onSuccess: () => phase === "ready" && setRound((current) => current + 1) },
		);
	// Wrapping up Christmas takes the coin upgrades away, so (like buying) it applies to the next
	// throw, or straight away before the elf has hopped.
	const wrapUpChristmas = () =>
		prestige.mutate(undefined, {
			onSuccess: () => {
				if (soundOn) {
					playGem();
				}

				if (phase === "ready") {
					setRound((current) => current + 1);
				}
			},
		});
	// Looks only change how things look, so buying one puts it to use straight away, even mid-throw.
	const buySkin = (id: ISkinId) => purchase.mutate({ kind: "skin", item: id });
	const buyBatter = (id: IBatterId) => purchase.mutate({ kind: "batter", item: id });
	const wearSkin = (id: ISkinId) => looks.mutate({ skin: id });
	const wearBatter = (id: IBatterId) => looks.mutate({ batter: id });

	const prompt =
		phase === "done" && result
			? result.message
			: jumps.available
				? `Tap to give ${skin.subject} a jump! (${jumps.left} left)`
				: phase === "ready" && touchScreen
					? `Tap the game to send ${skin.subject} hopping off the presents.`
					: phase === "ready" || phase === "done"
						? `Click the game (or press Space) to send ${skin.subject} hopping off the presents.`
						: phase === "dropping" && !touchScreen
							? "Now swing! (Click or press Space.)"
							: PROMPTS[phase];
	// Over the game in full screen: the same, minus the "Wheee!" (the flight speaks for itself),
	// and after a throw, the coins and how to go again, since the page's buttons are hidden.
	const coinsNote = result?.banked && result.banked.coins > 0 ? ` +${result.banked.coins} coins.` : "";
	const overlay =
		phase === "done" && result
			? `${result.message}${coinsNote} ${touchScreen ? "Tap" : "Click or press Space"} to throw again.`
			: prompt === PROMPTS.flying
				? ""
				: prompt;

	const shopProps = {
		progress,
		busy: purchase.isPending || looks.isPending || prestige.isPending,
		onBuy: buy,
		onBuyGemUpgrade: buyGemUpgrade,
		onPrestige: wrapUpChristmas,
		onBuySkin: buySkin,
		onWearSkin: wearSkin,
		onBuyBatter: buyBatter,
		onWearBatter: wearBatter,
		touchScreen,
	};

	return (
		<>
			{/* On phones the game comes first, so it's on screen without scrolling; the intro follows it. */}
			<MantineText visibleFrom="xs">{INTRO}</MantineText>
			{/* The stage outlasts each round's game, so full screen survives "throw again". */}
			<div ref={stageRef} className={fullscreen ? `${classes.stage} ${classes.fullscreen}` : classes.stage}>
				<ElfFlingGame
					key={round}
					upgrades={combinedUpgrades(progress.upgrades, progress.gemUpgrades)}
					skin={progress.skin}
					batter={progress.batter}
					best={progress.bestDistance}
					onPhaseChange={setPhase}
					onFinish={handleFinish}
					onJumpsChange={setJumps}
					onRestart={throwAgain}
					overlay={overlay}
					fullscreen={fullscreen}
					onToggleFullscreen={fullscreen ? exitFullscreen : enterFullscreen}
					soundOn={soundOn}
					onToggleSound={toggleSound}
					coins={progress.coins}
					gems={progress.prestiges > 0 ? progress.gems : null}
					throwBanked={result?.banked != null}
					onOpenShop={() => setShopOpen(true)}
					shopOpen={shopOpen}
				/>
				{/* The shop over the game, so there's no leaving full screen to buy something. It's
				    drawn in place inside the stage (no portal): in full screen, nothing outside it shows. Up from the
				    bottom on phones, in from the side otherwise. */}
				<Drawer
					opened={shopOpen}
					onClose={() => setShopOpen(false)}
					position={touchScreen ? "bottom" : "right"}
					size={touchScreen ? "100%" : "md"}
					withinPortal={false}
					title={
						<Group justify="space-between" wrap="nowrap" gap="sm">
							Shop
							<Balances progress={progress} compact />
						</Group>
					}
					classNames={{ inner: classes.shopDrawer, title: classes.shopDrawerTitle }}
					padding="sm"
				>
					{(purchase.isError || looks.isError || prestige.isError) && (
						<Alert color="red" mb="sm">
							{apiErrorMessage(purchase.error ?? looks.error ?? prestige.error)}
						</Alert>
					)}
					<ElfFlingShop {...shopProps} inDrawer />
				</Drawer>
			</div>
			<Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
				<div aria-live="polite" style={{ flex: 1, minWidth: 0 }}>
					<MantineText fw={700}>{prompt}</MantineText>
					{phase === "done" && result?.banked && result.banked.coins > 0 && (
						<MantineText size="sm" fw={700} c="var(--festive-gold-text)">
							+{result.banked.coins} {result.banked.coins === 1 ? "coin" : "coins"}
							{result.banked.bonus > 0 && ` (${result.banked.bonus} from ${bonusSources(progress)})`}
						</MantineText>
					)}
					{phase === "done" && result?.banked?.newBest && (
						<MantineText size="sm" c="green" fw={700}>
							That&apos;s a new best!
						</MantineText>
					)}
					{phase === "done" && result?.saveFailed && (
						<MantineText size="sm" c="red">
							That throw couldn&apos;t be saved, so its coins weren&apos;t banked. Check your connection.
						</MantineText>
					)}
					<MantineText size="sm" c="dimmed">
						Your best: {progress.bestDistance ? `${progress.bestDistance.toFixed(1)} m` : "none yet"}
					</MantineText>
				</div>
				{phase === "done" && (
					<Button
						leftSection={<FontAwesomeIcon icon={faRotateRight} />}
						onClick={(event) => {
							throwAgain();
							releaseFocus(event);
						}}
						style={{ flex: "none" }}
					>
						Throw again
					</Button>
				)}
			</Group>
			<MantineText hiddenFrom="xs">{INTRO}</MantineText>
			<ElfFlingLeaderboard />
			{(purchase.isError || looks.isError || prestige.isError) && (
				<Alert color="red">{apiErrorMessage(purchase.error ?? looks.error ?? prestige.error)}</Alert>
			)}
			<ElfFlingShop {...shopProps} />
		</>
	);
}
