import { useState } from "react";
import { Alert, Button, SegmentedControl } from "@mantine/core";
import { CAST, castMember, CELLAR, SECOND_WAVE } from "Components/SilentNight/cast";
import type { IProgress, IPurchase } from "Components/SilentNight/hooks";
import { PATRONS } from "Components/SilentNight/patrons";
import { portraitUrl } from "Components/SilentNight/portraits";
import { iconUrl } from "Components/SilentNight/icons";
import type { ICastId } from "Components/SilentNight/types";
import { weaponInfo } from "Components/SilentNight/weapons";
import classes from "Components/SilentNight/SilentNight.module.less";

type IMenuProps = {
	progress: IProgress;
	/** Each of the cast standing, as an image. */
	castImages: Record<ICastId, string>;
	busy: boolean;
	error: string | null;
	onStart: (character: ICastId) => void;
	onChoose: (character: ICastId) => void;
	onBuy: (purchase: IPurchase) => void;
};

/**
 * Before a night: who to play as (the rest of the cast unlocked with coal), and the Coal Cellar:
 * upgrades, which last from night to night, and the second wave of patrons.
 */
export default function Menu({ progress, castImages, busy, error, onStart, onChoose, onBuy }: IMenuProps) {
	const [view, setView] = useState<"cast" | "cellar">("cast");
	const chosen = castMember(progress.character);

	return (
		<div className={`${classes.overlay} ${classes.menu}`}>
			<p className={classes.title}>Silent Night</p>
			<div className={classes.menuBar}>
				<SegmentedControl
					size="xs"
					value={view}
					onChange={(value) => setView(value as "cast" | "cellar")}
					data={[
						{ value: "cast", label: "Who plays" },
						{ value: "cellar", label: "Coal Cellar" },
					]}
				/>
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
									onClick={() => (owned ? onChoose(member.id) : onBuy({ kind: "cast", item: member.id }))}
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
						<img src={iconUrl(chosen.weapon)} alt="" className={classes.icon} />
						{weaponInfo(chosen.weapon).name}. <strong>{chosen.perk}:</strong> {chosen.perkText.toLowerCase()}.
					</p>
					<Button onClick={() => onStart(chosen.id)} disabled={busy}>
						Start the night
					</Button>
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
									<Button
										size="compact-xs"
										variant="default"
										disabled={busy || progress.coal < price}
										onClick={() => onBuy({ kind: "patron", item: id })}
									>
										{price} coal
									</Button>
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
									<Button
										size="compact-xs"
										variant="default"
										disabled={busy || progress.coal < price}
										onClick={() => onBuy({ kind: "cellar", item: upgrade.id })}
									>
										{price} coal
									</Button>
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
