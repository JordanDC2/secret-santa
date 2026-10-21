import { useEffect } from "react";
import { Button } from "@mantine/core";
import {
	BLESSINGS,
	blessingInfo,
	closeShrine,
	PATRONS,
	takeBargain,
	takeBlessing,
	takeCursedGear,
} from "Components/SilentNight/patrons";
import { gearLines, RARITY_COLOURS } from "Components/SilentNight/gear";
import { gunInfo, morphInfo } from "Components/SilentNight/guns";
import GearSlots from "Components/SilentNight/GearSlots";
import Treasure from "Components/SilentNight/Treasure";
import { bargainInfo, KRAMPUS_LINE } from "Components/SilentNight/bargains";
import { iconUrl } from "Components/SilentNight/icons";
import { banish, choiceKey, closeChest, reroll, skip, take, takeGear } from "Components/SilentNight/levelUp";
import { portraitUrl, type IPortraitId } from "Components/SilentNight/portraits";
import { playEquip, playMorph, playSelect } from "Components/SilentNight/sound";
import { PASSIVES } from "Components/SilentNight/stats";
import type { IChoice, IGear, IPatronId, IPrompt, IWorld } from "Components/SilentNight/types";
import { weaponInfo } from "Components/SilentNight/weapons";
import classes from "Components/SilentNight/SilentNight.module.less";

type IPromptProps = {
	world: IWorld;
	prompt: IPrompt;
	/** Called after any choice, so the game shows whatever the night waits on next (or carries on). */
	onChange: () => void;
};

/** A choice that makes its sound as it's taken. */
const withSound = (sound: () => void, action: () => void) => () => {
	sound();
	action();
};

/** What a level-up choice is, says and looks like. */
function describe(choice: IChoice): { name: string; icon: string | null; tag: string; text: string } {
	if (choice.kind === "fruitcake") {
		return { name: "Fruitcake", icon: iconUrl("fruitcake"), tag: "", text: "Heal 30 health." };
	}

	if (choice.kind === "morph") {
		const morph = morphInfo(choice.gun, choice.id);

		return {
			name: morph.name,
			icon: iconUrl(choice.gun),
			tag: `${gunInfo(choice.gun).name} morph`,
			text: morph.text,
		};
	}

	if (choice.kind === "weapon") {
		const info = weaponInfo(choice.id);

		return {
			name: info.name,
			icon: iconUrl(choice.id),
			tag: choice.level === 1 ? "New!" : `Level ${choice.level}`,
			text: choice.level === 1 ? info.description : info.levels[choice.level - 2],
		};
	}

	const info = PASSIVES.find((passive) => passive.id === choice.id)!;

	return {
		name: info.name,
		icon: iconUrl(choice.id),
		tag: choice.level === 1 ? "New!" : `Level ${choice.level}`,
		text: choice.level === 1 ? `${info.description} ${info.effect}.` : `${info.effect}.`,
	};
}

/** Whose a blessing is, for its card's colour: its patron's (a duo's first patron's). */
function blessingPatron(id: string): IPatronId {
	const { patron } = blessingInfo(id);

	return Array.isArray(patron) ? patron[0] : patron;
}

/** A speaker's portrait and words, over a set of cards. */
function Dialogue({
	portrait,
	name,
	from,
	line,
	colour,
}: {
	portrait: IPortraitId;
	name: string;
	from: string;
	line: string;
	colour: string;
}) {
	const url = portraitUrl(portrait);

	return (
		<div className={classes.dialogue}>
			<img src={url} alt="" className={classes.portrait} />
			<p className={classes.speaker} style={{ color: colour }}>
				{name}
				<span className={classes.speakerFrom}> of {from}</span>
			</p>
			<p className={classes.line}>“{line}”</p>
		</div>
	);
}

/** A piece of gear's name (in its rarity's colour) and what it does. */
function GearDetails({ gear, label, replacing }: { gear: IGear; label?: string; replacing?: IGear }) {
	return (
		<>
			<span className={classes.cardHead}>
				<img src={iconUrl(gear.slot)} alt="" className={classes.icon} />
				<span className={classes.cardName} style={{ color: RARITY_COLOURS[gear.rarity] }}>
					{gear.name}
				</span>
				{label && <span className={classes.cardTag}>{label}</span>}
			</span>
			<span className={classes.cardText}>
				{gearLines(gear).map((line) => (
					<span key={line.text} className={line.bad ? classes.price : undefined}>
						{line.text}
					</span>
				))}
				{replacing && <span className={classes.dim}>In place of your {replacing.name.toLowerCase()}</span>}
			</span>
		</>
	);
}

/**
 * Whatever the night's waiting on the player for, over the game: a level-up's choices, a chest's
 * treasure, a piece of gear, a patron's blessings at their shrine, Krampus's bargains (and cursed
 * gear) at his altar. On a keyboard, the number keys pick a card.
 */
export default function Prompt({ world, prompt, onChange }: IPromptProps) {
	// Each choice with its sound (a tick, a heavy chord for a gun's morph, wool and a buckle for gear);
	// the buttons that aren't cards, a tick.
	const act = (action: () => void, sound: (() => void) | null = playSelect) => {
		sound?.();
		action();
		onChange();
	};
	const cards: Array<() => void> =
		prompt.kind === "levelUp"
			? prompt.choices.map((choice) =>
					withSound(choice.kind === "morph" ? playMorph : playSelect, () => take(world, choice)),
				)
			: prompt.kind === "shrine"
				? prompt.choices.map((id) => withSound(playSelect, () => takeBlessing(world, id)))
				: prompt.kind === "altar"
					? [
							...prompt.choices.map((id) => withSound(playSelect, () => takeBargain(world, id))),
							...(prompt.gear ? [withSound(playEquip, () => takeCursedGear(world))] : []),
						]
					: prompt.kind === "gear"
						? [withSound(playEquip, () => takeGear(world)), withSound(playSelect, () => closeChest(world))]
						: [];

	useEffect(() => {
		const down = (event: KeyboardEvent) => {
			const pick = Number(event.key) - 1;

			if (pick >= 0 && pick < cards.length) {
				cards[pick]();
				onChange();
			}
		};
		window.addEventListener("keydown", down);

		return () => window.removeEventListener("keydown", down);
	});

	if (prompt.kind === "chest") {
		return <Treasure rewards={prompt.rewards} onDone={() => act(() => closeChest(world))} />;
	}

	if (prompt.kind === "gear") {
		const worn = world.player.gear[prompt.gear.slot];

		return (
			<div className={classes.overlay}>
				<p className={classes.title}>Gear</p>
				<GearSlots gear={world.player.gear} incoming={prompt.gear} />
				<div className={classes.cards}>
					<div className={classes.cardHolder}>
						<button type="button" className={classes.card} onClick={() => act(cards[0], null)}>
							<GearDetails gear={prompt.gear} label="New" />
						</button>
					</div>
					{worn && (
						<div className={classes.cardHolder}>
							<div className={`${classes.card} ${classes.worn}`}>
								<GearDetails gear={worn} label="Wearing" />
							</div>
						</div>
					)}
				</div>
				<div className={classes.promptButtons}>
					<Button onClick={() => act(cards[0], null)}>{worn ? "Wear it instead" : "Wear it"}</Button>
					<Button variant="subtle" onClick={() => act(cards[1], null)}>
						Leave it
					</Button>
				</div>
			</div>
		);
	}

	if (prompt.kind === "levelUp") {
		const { player } = world;

		return (
			<div className={classes.overlay}>
				<p className={classes.title}>Level {player.level}</p>
				<div className={classes.cards}>
					{prompt.choices.map((choice, index) => {
						const { name, icon, tag, text } = describe(choice);

						return (
							<div key={choiceKey(choice)} className={classes.cardHolder}>
								<button
									type="button"
									className={choice.kind === "morph" ? `${classes.card} ${classes.morph}` : classes.card}
									onClick={() => act(cards[index], null)}
								>
									<span className={classes.cardHead}>
										{icon && <img src={icon} alt="" className={classes.icon} />}
										<span className={classes.cardName}>{name}</span>
										<span className={classes.cardTag}>{tag}</span>
									</span>
									<span className={classes.cardText}>{text}</span>
								</button>
								{choice.kind !== "fruitcake" && player.banishes > 0 && (
									<button type="button" className={classes.banish} onClick={() => act(() => banish(world, choice))}>
										Banish
									</button>
								)}
							</div>
						);
					})}
				</div>
				<div className={classes.promptButtons}>
					<Button variant="default" disabled={player.rerolls === 0} onClick={() => act(() => reroll(world))}>
						Reroll ({player.rerolls})
					</Button>
					<Button variant="subtle" onClick={() => act(() => skip(world))}>
						Skip
					</Button>
				</div>
				{player.banishes > 0 && (
					<p className={classes.hint}>Banishing takes it out of every level-up this night ({player.banishes} left).</p>
				)}
			</div>
		);
	}

	if (prompt.kind === "shrine") {
		const patron = PATRONS[prompt.patron];

		return (
			<div className={`${classes.overlay} ${classes.meeting}`}>
				<Dialogue
					portrait={patron.id}
					name={patron.name}
					from={patron.from}
					line={patron.line}
					colour={patron.colour}
				/>
				<div className={classes.offer}>
					{prompt.choices.map((id, index) => {
						const blessing = BLESSINGS.find((each) => each.id === id)!;
						const now = world.player.blessings[id] ?? 0;
						const colour = PATRONS[blessingPatron(id)].colour;

						return (
							<button
								key={id}
								type="button"
								className={classes.card}
								style={{ borderColor: colour }}
								onClick={() => act(cards[index], null)}
							>
								<span className={classes.cardHead}>
									<span className={classes.cardName} style={{ color: colour }}>
										{blessing.name}
									</span>
									<span className={classes.cardTag}>
										{blessing.needs
											? "Duo"
											: blessing.ranks.length > 1
												? `Rank ${now + 1} of ${blessing.ranks.length}`
												: ""}
									</span>
								</span>
								<span className={classes.cardText}>{blessing.ranks[now]}</span>
							</button>
						);
					})}
					<Button variant="subtle" onClick={() => act(() => closeShrine(world))}>
						Leave
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className={`${classes.overlay} ${classes.meeting}`}>
			<Dialogue portrait="krampus" name="Krampus" from="the Alps" line={KRAMPUS_LINE} colour="#e04040" />
			<div className={classes.offer}>
				{prompt.choices.map((id, index) => {
					const bargain = bargainInfo(id);

					return (
						<button
							key={id}
							type="button"
							className={`${classes.card} ${classes.bargain}`}
							onClick={() => act(cards[index], null)}
						>
							<span className={classes.cardHead}>
								<span className={classes.cardName}>{bargain.name}</span>
							</span>
							<span className={classes.cardText}>
								<span className={classes.gift}>+ {bargain.gift}</span>
								<span className={classes.price}>− {bargain.price}</span>
							</span>
						</button>
					);
				})}
				{prompt.gear && (
					<button
						type="button"
						className={`${classes.card} ${classes.bargain}`}
						onClick={() => act(cards[prompt.choices.length], null)}
					>
						<GearDetails gear={prompt.gear} replacing={world.player.gear[prompt.gear.slot]} />
					</button>
				)}
				<Button variant="subtle" onClick={() => act(() => closeShrine(world))}>
					Refuse
				</Button>
				<p className={classes.hint}>He'll be stronger at dawn for every bargain taken.</p>
			</div>
		</div>
	);
}
