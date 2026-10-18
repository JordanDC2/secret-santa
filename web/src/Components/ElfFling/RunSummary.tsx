import type { IOutcome } from "Components/ElfFling/physics";
import classes from "Components/ElfFling/ElfFling.module.less";

/** What a finished run did, for the summary over the game. */
export type IRunStats = {
	outcome: IOutcome;
	distance: number;
	/** Coins picked up, before any multipliers (what the score counts). */
	coins: number;
	pinballPoints: number;
	pops: number;
	smashes: number;
	grabs: number;
	logFires: number;
	chimneys: number;
	bonks: number;
	sleighRide: boolean;
};

type IRunSummaryProps = {
	run: IRunStats;
	/** Once the server has banked the throw: coins banked (with any bonus) and whether it's a new best. */
	banked: { coins: number; bonus: number; newBest: boolean; score: number } | null;
	saveFailed: boolean;
	touchScreen: boolean;
};

const HEADLINES: Record<IOutcome, string> = {
	perfect: "Perfect swing!",
	hit: "Nice swing!",
	miss: "Swing and a miss!",
	late: "Too late!",
};

/**
 * The end of a run, over the game (full screen or not): how it went, the score worked out
 * (distance + coins + pinball), the coins banked, what happened along the way, and how to go
 * again. Taps pass through it to the game.
 */
export default function RunSummary({ run, banked, saveFailed, touchScreen }: IRunSummaryProps) {
	const flew = run.outcome === "hit" || run.outcome === "perfect";
	const metres = Math.round(run.distance);
	const score = metres + run.coins + run.pinballPoints;
	const stats = [
		run.pops > 0 && `${run.pops} ${run.pops === 1 ? "cracker" : "crackers"}`,
		run.smashes > 0 && `${run.smashes} ${run.smashes === 1 ? "ornament" : "ornaments"}`,
		run.grabs > 0 && `${run.grabs} ${run.grabs === 1 ? "power-up" : "power-ups"}`,
		run.logFires > 0 && `${run.logFires} ${run.logFires === 1 ? "Yule log" : "Yule logs"}`,
		run.chimneys > 0 && `${run.chimneys} ${run.chimneys === 1 ? "chimney" : "chimneys"}`,
		run.sleighRide && "Sleigh ride",
		run.bonks > 0 && `${run.bonks} ${run.bonks === 1 ? "snowman" : "snowmen"}`,
	].filter((stat): stat is string => Boolean(stat));

	return (
		<div className={classes.runSummary} aria-live="polite">
			<div className={classes.runHeadline}>
				{HEADLINES[run.outcome]}
				{flew && <span className={classes.runDistance}>{run.distance.toFixed(1)} m</span>}
			</div>
			{flew && (
				<dl className={classes.runScore}>
					<dt>Distance</dt>
					<dd>{metres.toLocaleString()}</dd>
					<dt>Coins</dt>
					<dd>+{run.coins.toLocaleString()}</dd>
					{run.pinballPoints > 0 && (
						<>
							<dt>Pinball</dt>
							<dd>+{run.pinballPoints.toLocaleString()}</dd>
						</>
					)}
					<dt className={classes.runTotal}>Score</dt>
					<dd className={classes.runTotal}>{score.toLocaleString()}</dd>
				</dl>
			)}
			{banked && (banked.coins > 0 || banked.newBest) && (
				<div className={classes.runBanked}>
					{banked.coins > 0 && `+${banked.coins.toLocaleString()} coins banked`}
					{banked.coins > 0 && banked.bonus > 0 && ` (${banked.bonus.toLocaleString()} bonus)`}
					{banked.newBest && <span className={classes.runBest}>New best!</span>}
				</div>
			)}
			{saveFailed && <div className={classes.runFailed}>Not saved: check your connection.</div>}
			{stats.length > 0 && (
				<ul className={classes.runStats}>
					{stats.map((stat) => (
						<li key={stat}>{stat}</li>
					))}
				</ul>
			)}
			<div className={classes.runHint}>{touchScreen ? "Tap" : "Click or press Space"} to throw again</div>
		</div>
	);
}
