import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { iconUrl } from "Components/SilentNight/icons";
import { playReelStop, playReelTick } from "Components/SilentNight/sound";
import { PASSIVES } from "Components/SilentNight/stats";
import type { IReward } from "Components/SilentNight/types";
import { WEAPONS } from "Components/SilentNight/weapons";
import classes from "Components/SilentNight/SilentNight.module.less";

/** Every face a reel can show as it spins. */
const FACES = [...WEAPONS.map((weapon) => weapon.id), ...PASSIVES.map((passive) => passive.id)];
/** How often a spinning reel changes face, when the first reel stops, and how long after it each next one does (ms). */
const FLICK = 70;
const FIRST_STOP = 900;
const NEXT_STOP = 550;

const randomFace = () => FACES[Math.floor(Math.random() * FACES.length)];

/**
 * A chest opening, as in Vampire Survivors: a reel for each thing inside, flicking through
 * everything there is to find, then stopping one by one on what was found, with its picture and
 * what it did. Clicking (or Enter or Space) while they spin stops them all at once; after, it
 * carries on.
 */
export default function Treasure({ rewards, onDone }: { rewards: IReward[]; onDone: () => void }) {
	const [stopped, setStopped] = useState(0);
	const [faces, setFaces] = useState(() => rewards.map(randomFace));
	const spinning = stopped < rewards.length;
	const stoppedRef = useRef(0);

	const stopUpTo = useCallback(
		(count: number) => {
			for (let i = stoppedRef.current; i < count; i++) {
				playReelStop(rewards[i].evolved);
			}

			stoppedRef.current = Math.max(stoppedRef.current, count);
			setStopped(stoppedRef.current);
		},
		[rewards],
	);

	useEffect(() => {
		const flick = window.setInterval(() => {
			if (stoppedRef.current >= rewards.length) {
				window.clearInterval(flick);

				return;
			}

			setFaces((current) => current.map((face, i) => (i < stoppedRef.current ? face : randomFace())));
			playReelTick();
		}, FLICK);
		const stops = rewards.map((_, i) => window.setTimeout(() => stopUpTo(i + 1), FIRST_STOP + i * NEXT_STOP));

		return () => {
			window.clearInterval(flick);
			stops.forEach((stop) => window.clearTimeout(stop));
		};
	}, [rewards, stopUpTo]);

	const next = () => (spinning ? stopUpTo(rewards.length) : onDone());

	useEffect(() => {
		const down = (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				next();
			}
		};
		window.addEventListener("keydown", down);

		return () => window.removeEventListener("keydown", down);
	});

	return (
		<div className={classes.overlay} onClick={spinning ? next : undefined}>
			<p className={classes.title}>Treasure</p>
			<div className={classes.reels}>
				{rewards.map((reward, i) => {
					const landed = i < stopped;

					return (
						// Each reward's words are its own (a level is only reached once).
						<div key={reward.text} className={classes.reelHolder}>
							<div
								className={[
									classes.reel,
									landed ? classes.reelLanded : classes.reelSpinning,
									landed && reward.evolved ? classes.reelEvolved : "",
								].join(" ")}
							>
								<img src={iconUrl(landed ? reward.id : faces[i])} alt="" className={classes.reelIcon} />
							</div>
							<span className={landed ? classes.reelText : `${classes.reelText} ${classes.reelHidden}`}>
								{reward.text}
							</span>
						</div>
					);
				})}
			</div>
			<Button onClick={next}>{spinning ? "Skip" : "Carry on"}</Button>
		</div>
	);
}
