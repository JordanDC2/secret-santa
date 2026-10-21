import { useState } from "react";
import { GEAR_SLOTS, gearLines, RARITY_COLOURS } from "Components/SilentNight/gear";
import { iconUrl } from "Components/SilentNight/icons";
import type { IGear, IGearSlot } from "Components/SilentNight/types";
import classes from "Components/SilentNight/SilentNight.module.less";

type IGearSlotsProps = {
	gear: Partial<Record<IGearSlot, IGear>>;
	/** A piece just found: its slot is lit up, as where it would go. */
	incoming?: IGear;
};

const SLOT_NAMES: Record<IGearSlot, string> = {
	hat: "Hat",
	scarf: "Scarf",
	mittens: "Mittens",
	boots: "Boots",
	charm: "Charm",
};

/**
 * The five gear slots, as in Death Must Die: each one empty or with its piece in, bordered in
 * the piece's rarity's colour. With a piece just found, its slot is lit; otherwise (in the pause
 * menu) choosing a slot shows what its piece does.
 */
export default function GearSlots({ gear, incoming }: IGearSlotsProps) {
	const [chosen, setChosen] = useState<IGearSlot | null>(() => GEAR_SLOTS.find((slot) => gear[slot]) ?? null);
	const shown = incoming ? null : chosen && gear[chosen];

	return (
		<div className={classes.gearSlots}>
			<div className={classes.gearRow}>
				{GEAR_SLOTS.map((slot) => {
					const piece = gear[slot];
					const lit = incoming?.slot === slot;

					return (
						<button
							key={slot}
							type="button"
							className={[
								classes.gearSlot,
								piece ? "" : classes.gearEmpty,
								lit ? classes.gearLit : "",
								!incoming && chosen === slot ? classes.gearChosen : "",
							].join(" ")}
							style={piece ? { borderColor: RARITY_COLOURS[piece.rarity] } : undefined}
							disabled={Boolean(incoming) || !piece}
							aria-label={piece ? `${SLOT_NAMES[slot]}: ${piece.name}` : `${SLOT_NAMES[slot]}: empty`}
							onClick={() => setChosen(slot)}
						>
							<img src={iconUrl(slot)} alt="" className={classes.gearIcon} />
							<span className={classes.gearSlotName}>{SLOT_NAMES[slot]}</span>
						</button>
					);
				})}
			</div>
			{shown && (
				<p className={classes.gearDetail}>
					<span style={{ color: RARITY_COLOURS[shown.rarity] }}>{shown.name}</span>
					{gearLines(shown).map((line) => (
						<span key={line.text} className={line.bad ? classes.price : undefined}>
							{line.text}
						</span>
					))}
				</p>
			)}
		</div>
	);
}
