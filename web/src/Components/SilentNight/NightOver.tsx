import type { ReactNode } from "react";
import { Button } from "@mantine/core";
import { bargainInfo } from "Components/SilentNight/bargains";
import { iconUrl } from "Components/SilentNight/icons";
import { blessingInfo, PATRONS } from "Components/SilentNight/patrons";
import type { IPatronId, IWorld } from "Components/SilentNight/types";
import { weaponInfo } from "Components/SilentNight/weapons";
import classes from "Components/SilentNight/SilentNight.module.less";

export function clock(seconds: number): string {
	const whole = Math.floor(seconds);

	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

type INightOverProps = {
	world: IWorld;
	onAgain: () => void;
	/** The night's place on the boards, once it's saved. */
	children?: ReactNode;
};

/** The night's end, won or lost: how long, how many, what the elf carried, and what each weapon did. */
export default function NightOver({ world, onAgain, children }: INightOverProps) {
	const { player } = world;
	const most = Math.max(1, ...player.weapons.map((weapon) => weapon.damage));
	const blessings = Object.entries(player.blessings);

	return (
		<div className={`${classes.overlay} ${classes.summary}`}>
			<p className={classes.title}>{world.won ? "Dawn" : "The night took you"}</p>
			<p>
				{world.won
					? `Krampus is beaten and the sun is up. You broke ${world.kills.toLocaleString()} of his horde.`
					: `You lasted ${clock(world.time)}, reached level ${player.level} and broke ${world.kills.toLocaleString()} of Krampus's horde.`}
			</p>
			<ul className={classes.damage}>
				{player.weapons.map((weapon) => {
					const info = weaponInfo(weapon.id);

					return (
						<li key={weapon.id}>
							<img src={iconUrl(weapon.id)} alt="" className={classes.icon} />
							<span className={classes.damageName}>
								{weapon.evolved ? info.evolution.name : info.name}{" "}
								<span className={classes.dim}>{weapon.evolved ? "" : `level ${weapon.level}`}</span>
							</span>
							<span className={classes.damageBar}>
								<span style={{ width: `${(weapon.damage / most) * 100}%` }} />
							</span>
							<span className={classes.damageNumber}>{Math.round(weapon.damage).toLocaleString()}</span>
						</li>
					);
				})}
			</ul>
			{blessings.length > 0 && (
				<p className={classes.blessings}>
					{blessings.map(([id, rank]) => {
						const info = blessingInfo(id);
						const patron: IPatronId = Array.isArray(info.patron) ? info.patron[0] : info.patron;

						return (
							<span key={id} style={{ color: PATRONS[patron].colour }}>
								{info.name}
								{info.ranks.length > 1 ? ` ${rank}` : ""}
							</span>
						);
					})}
				</p>
			)}
			{player.bargains.length > 0 && (
				<p className={classes.blessings}>
					{player.bargains.map((id) => (
						<span key={id} className={classes.price}>
							{bargainInfo(id).name}
						</span>
					))}
				</p>
			)}
			{children}
			<Button onClick={onAgain}>Another night</Button>
		</div>
	);
}
