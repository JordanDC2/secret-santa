import { Badge, Button, Divider, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";
import {
	nextPrice,
	SHOP_GROUPS,
	SHOP_ITEMS,
	type IShopItem,
	type IUpgradeId,
	type IUpgrades,
} from "Components/ElfFling/upgrades";
import classes from "Components/ElfFling/ElfFling.module.less";

type IElfFlingShopProps = {
	coins: number;
	upgrades: IUpgrades;
	onBuy: (id: IUpgradeId, price: number) => void;
};

/** Spend coins on upgrades, in sections: the swing, landings, in the air, coins. */
export default function ElfFlingShop({ coins, upgrades, onBuy }: IElfFlingShopProps) {
	return (
		<SectionCard
			title="Shop"
			action={
				<Badge size="lg" className={classes.coins} leftSection={<FontAwesomeIcon icon={faCoins} />}>
					{coins} {coins === 1 ? "coin" : "coins"}
				</Badge>
			}
		>
			<Stack gap="md">
				{SHOP_GROUPS.map((group) => (
					<Stack key={group} gap="sm">
						<Divider label={group} labelPosition="left" />
						{SHOP_ITEMS.filter((item) => item.group === group).map((item) => (
							<ShopRow key={item.id} item={item} level={upgrades[item.id]} coins={coins} onBuy={onBuy} />
						))}
					</Stack>
				))}
				<MantineText size="xs" c="dimmed">
					Coins and upgrades are saved on this device.
				</MantineText>
			</Stack>
		</SectionCard>
	);
}

type IShopRowProps = {
	item: IShopItem;
	level: number;
	coins: number;
	onBuy: (id: IUpgradeId, price: number) => void;
};

/** One upgrade: what it does, the level owned, and a buy button with the next price. */
function ShopRow({ item, level, coins, onBuy }: IShopRowProps) {
	const price = nextPrice(item, level);
	const hasLevels = item.prices.length > 1;

	return (
		<Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
			<div>
				<Group gap="xs">
					<MantineText fw={700}>{item.name}</MantineText>
					{hasLevels && level > 0 && (
						<Badge size="sm" variant="light" color="gray">
							Level {level} of {item.prices.length}
						</Badge>
					)}
				</Group>
				<MantineText size="sm" c="dimmed">
					{item.description}
				</MantineText>
			</div>
			{price === null ? (
				<Badge variant="light" color="green" style={{ flex: "none" }}>
					{hasLevels ? "Maxed" : "Owned"}
				</Badge>
			) : (
				<Button
					variant="secondary"
					size="xs"
					style={{ flex: "none" }}
					leftSection={<FontAwesomeIcon icon={faCoins} />}
					disabled={coins < price}
					aria-label={`Buy ${item.name}${hasLevels ? ` level ${level + 1}` : ""} for ${price} coins`}
					onClick={() => onBuy(item.id, price)}
				>
					{price}
				</Button>
			)}
		</Group>
	);
}
