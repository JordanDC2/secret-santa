import { Badge, Button, Group, Stack, Switch, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faGem } from "@fortawesome/free-solid-svg-icons";
import { releaseFocus } from "Components/ElfFling/releaseFocus";

export type IShopRowProps = {
	name: string;
	description: string;
	/** Levels owned, out of how many this shop sells (Infinity for the endless upgrades). */
	level: number;
	levels: number;
	/** A gem-shop note beside the name, e.g. "+1 extra" or "2 kept". */
	note?: string | null;
	/** What the levels do, in numbers (gemEffect). */
	effect?: string | null;
	/** Shown once there's nothing more to buy; "Maxed" or "Owned" unless given. */
	doneLabel?: string;
	/** The next level's price, or null if there's nothing more to buy here. */
	price: number | null;
	/** How many levels the button buys (the endless upgrades' ×5); the price is for all of them. */
	buyCount?: number;
	currency: "coins" | "gems";
	balance: number;
	busy: boolean;
	onBuy: () => void;
	/** For things that go on the course: whether it's switched on, and switching it (shown once owned). */
	on?: boolean;
	onSwitch?: (on: boolean) => void;
};

/** One upgrade: what it does, the levels owned, and a buy button with the next price. */
export default function ShopRow({
	name,
	description,
	level,
	levels,
	note = null,
	effect = null,
	buyCount = 1,
	doneLabel,
	price,
	currency,
	balance,
	busy,
	onBuy,
	on = true,
	onSwitch,
}: IShopRowProps) {
	const hasLevels = levels > 1;
	const done = doneLabel ?? (hasLevels ? "Maxed" : "Owned");

	return (
		<Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
			<div>
				<Group gap="xs">
					<MantineText fw={700}>{name}</MantineText>
					{hasLevels && level > 0 && (
						<Badge size="sm" variant="light" color="gray">
							{levels === Infinity ? `Level ${level}` : `Level ${level} of ${levels}`}
						</Badge>
					)}
					{note && (
						<Badge size="sm" variant="light" color="red" leftSection={<FontAwesomeIcon icon={faGem} />}>
							{note}
						</Badge>
					)}
				</Group>
				{description && (
					<MantineText size="sm" c="dimmed">
						{description}
					</MantineText>
				)}
				{effect && (
					<MantineText size="xs" fw={700} c="var(--festive-gold-text)">
						{effect}
					</MantineText>
				)}
			</div>
			<Stack gap={6} align="flex-end" style={{ flex: "none" }}>
				{price === null ? (
					<Badge variant="light" color={done === "Kept" ? "red" : "green"} style={{ flex: "none" }}>
						{done}
					</Badge>
				) : (
					<Button
						variant="secondary"
						size="xs"
						style={{ flex: "none" }}
						leftSection={<FontAwesomeIcon icon={currency === "gems" ? faGem : faCoins} />}
						disabled={busy || balance < price}
						aria-label={
							buyCount > 1
								? `Buy ${buyCount} levels of ${name} for ${price} ${currency}`
								: `Buy ${name}${hasLevels ? ` level ${level + 1}` : ""} for ${price} ${currency}`
						}
						onClick={(event) => {
							onBuy();
							releaseFocus(event);
						}}
					>
						{price}
					</Button>
				)}
				{onSwitch && level > 0 && (
					<Switch
						size="xs"
						label={on ? "On" : "Off"}
						labelPosition="left"
						checked={on}
						aria-label={`${name} on the course`}
						onChange={(event) => onSwitch(event.currentTarget.checked)}
					/>
				)}
			</Stack>
		</Group>
	);
}
