import GameButton from "Components/SilentNight/GameButton";
import { bargainInfo } from "Components/SilentNight/bargains";
import { RARITY_COLOURS } from "Components/SilentNight/gear";
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
	/** The coal the night earned, once it's saved. */
	coalEarned: number | null;
	onAgain: () => void;
	onMenu: () => void;
};

/**
 * The night's end, won or lost: how long, how many, what the elf carried, and what each weapon and
 * blessing (and Krampus's chains) did.
 */
export default function NightOver({ world, coalEarned, onAgain, onMenu }: INightOverProps) {
	const { player } = world;
	// The patrons' blessings that did damage, in the order taken (as the weapons are in the order
	// picked up), then Krampus's chains if they did any; each row's bar is its share of all the damage
	// done.
	const blessed = Object.keys(player.blessings).filter((id) => (player.damageBy[id] ?? 0) > 0);
	const chains = player.damageBy.chains ?? 0;
	const total = Math.max(
		1,
		player.weapons.reduce((sum, weapon) => sum + weapon.damage, 0) +
			blessed.reduce((sum, id) => sum + player.damageBy[id], 0) +
			chains,
	);
	const blessings = Object.entries(player.blessings);

	return (
		<div className={`${classes.overlay} ${classes.summary}`}>
			<p className={classes.title}>{world.won ? "Dawn" : "The night took you"}</p>
			<p>
				{world.won
					? `Krampus is beaten and the sun is up. You slew ${world.kills.toLocaleString()} of his horde.`
					: `You lasted ${clock(world.time)}, reached level ${player.level} and slew ${world.kills.toLocaleString()} of Krampus's horde.`}
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
								<span style={{ width: `${(weapon.damage / total) * 100}%` }} />
							</span>
							<span className={classes.damageNumber}>{Math.round(weapon.damage).toLocaleString()}</span>
						</li>
					);
				})}
				{blessed.map((id) => {
					const damage = player.damageBy[id];
					const info = blessingInfo(id);
					const patron: IPatronId = Array.isArray(info.patron) ? info.patron[0] : info.patron;

					return (
						<li key={id}>
							<img src={iconUrl(patron)} alt="" className={classes.icon} />
							<span className={classes.damageName} style={{ color: PATRONS[patron].colour }}>
								{info.name}
							</span>
							<span className={classes.damageBar}>
								<span style={{ width: `${(damage / total) * 100}%` }} />
							</span>
							<span className={classes.damageNumber}>{Math.round(damage).toLocaleString()}</span>
						</li>
					);
				})}
				{chains > 0 && (
					<li>
						<img src={iconUrl("chains")} alt="" className={classes.icon} />
						<span className={`${classes.damageName} ${classes.price}`}>{bargainInfo("chains").name}</span>
						<span className={classes.damageBar}>
							<span style={{ width: `${(chains / total) * 100}%` }} />
						</span>
						<span className={classes.damageNumber}>{Math.round(chains).toLocaleString()}</span>
					</li>
				)}
			</ul>
			{blessings.length > 0 && (
				<p className={classes.blessings}>
					{blessings.map(([id, rank]) => {
						const info = blessingInfo(id);
						const patron: IPatronId = Array.isArray(info.patron) ? info.patron[0] : info.patron;

						return (
							<span key={id} style={{ color: PATRONS[patron].colour }}>
								{info.name}
								{info.ranks.length > 1 ? ` ${["I", "II", "III"][rank - 1]}` : ""}
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
			{Object.keys(player.gear).length > 0 && (
				<p className={classes.blessings}>
					{Object.values(player.gear).map((piece) => (
						<span key={piece.slot} style={{ color: RARITY_COLOURS[piece.rarity] }}>
							{piece.name}
						</span>
					))}
				</p>
			)}
			<p className={classes.coal}>
				{coalEarned === null ? "Counting your coal..." : `+${coalEarned.toLocaleString()} coal`}
			</p>
			<div className={classes.promptButtons}>
				<GameButton onClick={onAgain}>Another night</GameButton>
				<GameButton variant="quiet" onClick={onMenu}>
					Back to the menu
				</GameButton>
			</div>
		</div>
	);
}
