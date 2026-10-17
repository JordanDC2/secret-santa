import { Badge, Button, Divider, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";
import { nextPrice, SHOP_GROUPS, SHOP_ITEMS, type IShopItem, type IUpgradeId } from "Components/ElfFling/upgrades";
import type { IProgress } from "Components/ElfFling/progress";
import { SKINS, type ISkin, type ISkinId } from "Components/ElfFling/skins";
import classes from "Components/ElfFling/ElfFling.module.less";

type IElfFlingShopProps = {
	progress: IProgress;
	onBuy: (id: IUpgradeId, price: number) => void;
	onBuySkin: (id: ISkinId, price: number) => void;
	onWearSkin: (id: ISkinId) => void;
	/** On a phone, keyboard shortcuts aren't mentioned. */
	touchScreen: boolean;
};

/** Spend coins on upgrades, in sections (the swing, landings, in the air, coins), and on looks. */
export default function ElfFlingShop({ progress, onBuy, onBuySkin, onWearSkin, touchScreen }: IElfFlingShopProps) {
	const { coins, upgrades } = progress;

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
							<ShopRow
								key={item.id}
								item={item}
								level={upgrades[item.id]}
								coins={coins}
								onBuy={onBuy}
								touchScreen={touchScreen}
							/>
						))}
					</Stack>
				))}
				<Stack gap="sm">
					<Divider label="Looks" labelPosition="left" />
					{SKINS.map((skin) => (
						<SkinRow
							key={skin.id}
							skin={skin}
							owned={progress.skins.includes(skin.id)}
							wearing={progress.skin === skin.id}
							coins={coins}
							onBuy={onBuySkin}
							onWear={onWearSkin}
						/>
					))}
				</Stack>
				<MantineText size="xs" c="dimmed">
					Coins, upgrades and looks are saved on this device.
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
	touchScreen: boolean;
};

/** One upgrade: what it does, the level owned, and a buy button with the next price. */
function ShopRow({ item, level, coins, onBuy, touchScreen }: IShopRowProps) {
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
					{!touchScreen && item.keyboardHint && ` ${item.keyboardHint}`}
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

type ISkinRowProps = {
	skin: ISkin;
	owned: boolean;
	wearing: boolean;
	coins: number;
	onBuy: (id: ISkinId, price: number) => void;
	onWear: (id: ISkinId) => void;
};

/** One look: buy it, put it on, or a badge for the one being worn. Just for looks: no effect on throws. */
function SkinRow({ skin, owned, wearing, coins, onBuy, onWear }: ISkinRowProps) {
	return (
		<Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
			<div>
				<MantineText fw={700}>{skin.name}</MantineText>
				<MantineText size="sm" c="dimmed">
					{skin.description}
				</MantineText>
			</div>
			{wearing ? (
				<Badge variant="light" color="green" style={{ flex: "none" }}>
					Wearing
				</Badge>
			) : owned ? (
				<Button variant="secondary" size="xs" style={{ flex: "none" }} onClick={() => onWear(skin.id)}>
					Wear
				</Button>
			) : (
				<Button
					variant="secondary"
					size="xs"
					style={{ flex: "none" }}
					leftSection={<FontAwesomeIcon icon={faCoins} />}
					disabled={coins < skin.price}
					aria-label={`Buy ${skin.name} for ${skin.price} coins`}
					onClick={() => onBuy(skin.id, skin.price)}
				>
					{skin.price}
				</Button>
			)}
		</Group>
	);
}
