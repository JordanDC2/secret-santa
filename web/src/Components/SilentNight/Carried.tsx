import type { ReactNode } from "react";
import { Tooltip } from "@mantine/core";
import { isGun, morphInfo } from "Components/SilentNight/guns";
import { iconUrl } from "Components/SilentNight/icons";
import { PASSIVES } from "Components/SilentNight/stats";
import type { IPlayer } from "Components/SilentNight/types";
import { weaponInfo } from "Components/SilentNight/weapons";
import classes from "Components/SilentNight/SilentNight.module.less";

/** What something does, shown on hovering it, focusing it or tapping it (for phones). */
export function Tip({ label, children }: { label: ReactNode; children: ReactNode }) {
	return (
		<Tooltip
			label={label}
			withArrow
			multiline
			w={220}
			events={{ hover: true, focus: true, touch: true }}
			// Inside the game, not over the page: in full screen, only the game shows.
			withinPortal={false}
			classNames={{ tooltip: classes.tip }}
		>
			{children}
		</Tooltip>
	);
}

/** Everything the elf carries, in the pause menu: each weapon and passive at its level, saying what it does. */
export default function Carried({ player }: { player: IPlayer }) {
	const weapons = player.weapons.map((weapon) => {
		const { id } = weapon;
		const info = weaponInfo(id);
		const morphs = isGun(id) ? weapon.morphs.map((morph) => morphInfo(id, morph)) : [];

		return {
			id: weapon.id,
			level: weapon.evolved ? "★" : String(weapon.level),
			evolved: weapon.evolved,
			label: (
				<>
					<strong>{weapon.evolved ? info.evolution.name : info.name}</strong>
					{weapon.evolved ? "" : `, level ${weapon.level}`}
					<br />
					{weapon.evolved ? info.evolution.description : info.description}
					{morphs.map((morph) => (
						<span key={morph.id} className={classes.tipLine}>
							<strong>{morph.name}:</strong> {morph.text}
						</span>
					))}
					{isGun(id) && morphs.length === 0 && (
						<span className={classes.tipLine}>Morphs offered at levels 3 and 6.</span>
					)}
				</>
			),
		};
	});
	const passives = PASSIVES.filter((passive) => player.passives[passive.id]).map((passive) => ({
		id: passive.id,
		level: String(player.passives[passive.id]),
		evolved: false,
		label: (
			<>
				<strong>{passive.name}</strong>, level {player.passives[passive.id]}
				<br />
				{passive.description} {passive.effect}.
			</>
		),
	}));

	return (
		<div className={classes.pauseBuild}>
			{[...weapons, ...passives].map((item) => (
				<Tip key={item.id} label={item.label}>
					<button type="button" className={`${classes.slot} ${classes.tipTarget}`}>
						<img
							src={iconUrl(item.id)}
							alt=""
							className={item.evolved ? `${classes.gearIcon} ${classes.evolved}` : classes.gearIcon}
						/>
						<span className={classes.slotLevel}>{item.level}</span>
					</button>
				</Tip>
			))}
		</div>
	);
}
