import { Tip } from "Components/SilentNight/Carried";
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
 * the piece's rarity's colour, saying what the piece does on hovering or tapping it. With a piece
 * just found, its slot is lit.
 */
export default function GearSlots({ gear, incoming }: IGearSlotsProps) {
	return (
		<div className={classes.gearRow}>
			{GEAR_SLOTS.map((slot) => {
				const piece = gear[slot];
				const button = (
					<button
						key={slot}
						type="button"
						className={[
							classes.gearSlot,
							piece ? classes.tipTarget : classes.gearEmpty,
							incoming?.slot === slot ? classes.gearLit : "",
						].join(" ")}
						style={piece ? { borderColor: RARITY_COLOURS[piece.rarity] } : undefined}
						aria-label={piece ? `${SLOT_NAMES[slot]}: ${piece.name}` : `${SLOT_NAMES[slot]}: empty`}
					>
						<img src={iconUrl(slot)} alt="" className={classes.gearIcon} />
						<span className={classes.gearSlotName}>{SLOT_NAMES[slot]}</span>
					</button>
				);

				return piece ? (
					<Tip
						key={slot}
						label={
							<>
								<strong style={{ color: RARITY_COLOURS[piece.rarity] }}>{piece.name}</strong>
								{gearLines(piece).map((line) => (
									<span key={line.text} className={line.bad ? `${classes.tipLine} ${classes.price}` : classes.tipLine}>
										{line.text}
									</span>
								))}
							</>
						}
					>
						{button}
					</Tip>
				) : (
					button
				);
			})}
		</div>
	);
}
