import { useState } from "react";
import { Divider, Group, SegmentedControl, Stack } from "@mantine/core";
import { affordableLevels, endlessPrice, type IEndlessItem } from "Components/ElfFling/upgrades";
import { letGoOfFocus } from "Components/ElfFling/releaseFocus";
import ShopRow from "Components/ElfFling/ShopRow";

type IBulk = "1" | "5" | "max";

type IEndlessUpgradesProps<TId extends string> = {
	label: string;
	items: IEndlessItem<TId>[];
	level: (id: TId) => number;
	currency: "coins" | "gems";
	balance: number;
	busy: boolean;
	onBuy: (id: TId, count: number) => void;
};

/**
 * Endless upgrades (no top level, each level dearer than the last), with a toggle to buy one
 * level, five, or as many as the balance allows. Used by both shops.
 */
export default function EndlessUpgrades<TId extends string>({
	label,
	items,
	level,
	currency,
	balance,
	busy,
	onBuy,
}: IEndlessUpgradesProps<TId>) {
	const [bulk, setBulk] = useState<IBulk>("1");
	// "Max" with nothing affordable still shows the next level's price, greyed out.
	const levelsToBuy = (item: IEndlessItem<TId>) =>
		bulk === "max" ? Math.max(1, affordableLevels(item, level(item.id), balance)) : Number(bulk);

	return (
		<Stack gap="sm">
			<Group gap="sm" wrap="nowrap">
				<Divider label={label} labelPosition="left" style={{ flex: 1 }} />
				<SegmentedControl
					size="xs"
					data={[
						{ value: "1", label: "×1" },
						{ value: "5", label: "×5" },
						{ value: "max", label: "Max" },
					]}
					value={bulk}
					onChange={(value) => {
						setBulk(value as IBulk);
						letGoOfFocus();
					}}
					aria-label="Levels per buy"
				/>
			</Group>
			{items.map((item) => {
				const now = level(item.id);
				const count = levelsToBuy(item);
				const value = (n: number) => `+${n * item.percentPerLevel}%`;

				return (
					<ShopRow
						key={item.id}
						name={item.name}
						description={item.description}
						effect={
							now === 0
								? `${item.effectLabel}: ${value(count)} at level ${count}`
								: `${item.effectLabel}: ${value(now)} now, ${value(now + count)} at level ${now + count}`
						}
						level={now}
						levels={Infinity}
						price={endlessPrice(item, now, count)}
						buyCount={count}
						currency={currency}
						balance={balance}
						busy={busy}
						onBuy={() => onBuy(item.id, count)}
					/>
				);
			})}
		</Stack>
	);
}
