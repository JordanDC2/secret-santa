import { useState } from "react";
import { Alert } from "@mantine/core";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CAST, castMember, CELLAR, SECOND_WAVE } from "Components/SilentNight/cast";
import GameButton from "Components/SilentNight/GameButton";
import type { IProgress, IPurchase } from "Components/SilentNight/hooks";
import { PATRONS } from "Components/SilentNight/patrons";
import { portraitUrl } from "Components/SilentNight/portraits";
import { iconUrl } from "Components/SilentNight/icons";
import { GUNS, isGun } from "Components/SilentNight/guns";
import { playSelect } from "Components/SilentNight/sound";
import type { ICastId, IGunId } from "Components/SilentNight/types";
import { weaponInfo } from "Components/SilentNight/weapons";
import classes from "Components/SilentNight/SilentNight.module.less";

type IMenuProps = {
	progress: IProgress;
	/** Each of the cast standing, as an image. */
	castImages: Record<ICastId, string>;
	busy: boolean;
	error: string | null;
	onStart: (character: ICastId, gun: IGunId) => void;
	onChoose: (character: ICastId) => void;
	onBuy: (purchase: IPurchase) => void;
};

const GUN_KEY = "silent-night-gun";

/** The gun last chosen on this device (the candy cane gun the first time). */
function readGun(): IGunId {
	try {
		const saved = window.localStorage.getItem(GUN_KEY) ?? "";

		return isGun(saved) ? saved : "gun";
	} catch {
		return "gun";
	}
}

function saveGun(gun: IGunId) {
	try {
		window.localStorage.setItem(GUN_KEY, gun);
	} catch {
		// Not remembered this time; it's still chosen for this night.
	}
}

/**
 * The game's main menu, the first thing you see: start a night, or go down to the Coal Cellar.
 * Starting takes you to who to play as (the rest of the cast unlocked with coal) and which gun
 * they carry (remembered on this device; the rest of the guns unlocked with coal too), and the Coal Cellar:
 * upgrades, which last from night to night, and the second wave of patrons.
 */
export default function Menu({ progress, castImages, busy, error, onStart, onChoose, onBuy }: IMenuProps) {
	const [view, setView] = useState<"main" | "cast" | "cellar">("main");
	const chosen = castMember(progress.character);
	// The gun picked, if it's theirs (one still being unlocked is picked once it is), else the candy cane gun.
	const [picked, setPicked] = useState(readGun);
	const gun = progress.guns.includes(picked) ? picked : "gun";
	const chooseGun = (id: IGunId) => {
		playSelect();
		setPicked(id);
		saveGun(id);

		if (!progress.guns.includes(id)) {
			onBuy({ kind: "gun", item: id });
		}
	};
	const back = (
		<GameButton
			variant="quiet"
			small
			icon={<FontAwesomeIcon icon={faArrowLeft} />}
			onClick={() => setView("main")}
			disabled={busy}
		>
			Back
		</GameButton>
	);

	if (view === "main") {
		return (
			<div className={`${classes.overlay} ${classes.menu}`}>
				<p className={`${classes.title} ${classes.mainTitle}`}>Silent Night</p>
				<p className={classes.line}>
					The longest night of the year, and Krampus&apos;s horde has come out of the dark.
				</p>
				<div className={classes.mainButtons}>
					<GameButton onClick={() => setView("cast")}>Start the longest night</GameButton>
					<GameButton variant="plain" onClick={() => setView("cellar")}>
						Coal Cellar
					</GameButton>
				</div>
				<span className={classes.coal}>{progress.coal.toLocaleString()} coal</span>
			</div>
		);
	}

	return (
		<div className={`${classes.overlay} ${classes.menu}`}>
			<div className={classes.menuBar}>
				{back}
				<p className={classes.title}>{view === "cast" ? "Who plays?" : "Coal Cellar"}</p>
				<span className={classes.coal}>{progress.coal.toLocaleString()} coal</span>
			</div>

			{view === "cast" ? (
				<>
					<div className={classes.castRow}>
						{CAST.map((member) => {
							const owned = progress.cast.includes(member.id);

							return (
								<button
									key={member.id}
									type="button"
									className={member.id === chosen.id ? `${classes.castCard} ${classes.chosen}` : classes.castCard}
									disabled={busy || (!owned && progress.coal < member.price)}
									onClick={() => {
										playSelect();

										if (owned) {
											onChoose(member.id);
										} else {
											onBuy({ kind: "cast", item: member.id });
										}
									}}
								>
									<img
										src={castImages[member.id]}
										alt=""
										className={owned ? classes.castImage : `${classes.castImage} ${classes.locked}`}
									/>
									<span className={classes.castName}>{member.name}</span>
									{!owned && <span className={classes.castPrice}>Unlock: {member.price} coal</span>}
								</button>
							);
						})}
					</div>
					<p className={classes.castPerk}>
						{chosen.weapon && (
							<>
								<img src={iconUrl(chosen.weapon)} alt="" className={classes.icon} />
								{weaponInfo(chosen.weapon).name}.
							</>
						)}{" "}
						<strong>{chosen.perk}:</strong> {chosen.perkText.toLowerCase()}.
					</p>
					<div className={classes.gunRow} role="radiogroup" aria-label="Gun">
						{GUNS.map((info) => {
							const owned = progress.guns.includes(info.id);

							return (
								<button
									key={info.id}
									type="button"
									role="radio"
									aria-checked={info.id === gun}
									className={info.id === gun ? `${classes.gunCard} ${classes.chosen}` : classes.gunCard}
									disabled={!owned && (busy || progress.coal < info.price)}
									onClick={() => chooseGun(info.id)}
								>
									<img
										src={iconUrl(info.id)}
										alt=""
										className={owned ? classes.gearIcon : `${classes.gearIcon} ${classes.locked}`}
									/>
									<span className={classes.gunName}>{info.name}</span>
									{!owned && <span className={classes.castPrice}>Unlock: {info.price} coal</span>}
								</button>
							);
						})}
					</div>
					<p className={classes.castPerk}>{GUNS.find((info) => info.id === gun)!.description}</p>
					<GameButton onClick={() => onStart(chosen.id, gun)} disabled={busy}>
						Start the night
					</GameButton>
				</>
			) : (
				<ul className={classes.cellar}>
					{SECOND_WAVE.map(({ id, price }) => {
						const patron = PATRONS[id];
						const unlocked = progress.patrons.includes(id);

						return (
							<li key={id}>
								<img src={portraitUrl(id)} alt="" className={classes.cellarPortrait} />
								<span className={classes.cellarName}>
									<span style={{ color: patron.colour }}>{patron.name}</span>
									<span className={classes.dim}> of {patron.from}: their shrines appear in the night</span>
								</span>
								{unlocked ? (
									<span className={classes.dim}>Unlocked</span>
								) : (
									<GameButton
										variant="plain"
										small
										disabled={busy || progress.coal < price}
										onClick={() => onBuy({ kind: "patron", item: id })}
									>
										{price} coal
									</GameButton>
								)}
							</li>
						);
					})}
					{CELLAR.map((upgrade) => {
						const level = progress.cellar[upgrade.id] ?? 0;
						const price = upgrade.prices[level];

						return (
							<li key={upgrade.id}>
								<span className={classes.cellarName}>
									{upgrade.name}
									<span className={classes.dim}> {upgrade.effect}</span>
								</span>
								<span className={classes.pips} aria-label={`Level ${level} of ${upgrade.prices.length}`}>
									{"◆".repeat(level)}
									<span className={classes.dim}>{"◇".repeat(upgrade.prices.length - level)}</span>
								</span>
								{price === undefined ? (
									<span className={classes.dim}>All bought</span>
								) : (
									<GameButton
										variant="plain"
										small
										disabled={busy || progress.coal < price}
										onClick={() => onBuy({ kind: "cellar", item: upgrade.id })}
									>
										{price} coal
									</GameButton>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{error && (
				<Alert color="red" py={4}>
					{error}
				</Alert>
			)}
		</div>
	);
}
