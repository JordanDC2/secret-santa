import { Badge, Button, Divider, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";
import { nextPrice, SHOP_GROUPS, SHOP_ITEMS, type IShopItem, type IUpgradeId } from "Components/ElfFling/upgrades";
import type { IProgress } from "Components/ElfFling/progress";
import { BATTERS, SKINS, type IBatterId, type ISkinId } from "Components/ElfFling/skins";
import classes from "Components/ElfFling/ElfFling.module.less";

type IElfFlingShopProps = {
	progress: IProgress;
	onBuy: (id: IUpgradeId, price: number) => void;
	onBuySkin: (id: ISkinId, price: number) => void;
	onWearSkin: (id: ISkinId) => void;
	onBuyBatter: (id: IBatterId, price: number) => void;
	onWearBatter: (id: IBatterId) => void;
	/** On a phone, keyboard shortcuts aren't mentioned. */
	touchScreen: boolean;
};

/** Spend coins on upgrades, in sections (the swing, landings, in the air, coins), and on looks. */
export default function ElfFlingShop({
	progress,
	onBuy,
	onBuySkin,
	onWearSkin,
	onBuyBatter,
	onWearBatter,
	touchScreen,
}: IElfFlingShopProps) {
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
					<Divider label="Looks: who gets flung" labelPosition="left" />
					{SKINS.map((skin) => (
						<LookRow
							key={skin.id}
							look={skin}
							owned={progress.skins.includes(skin.id)}
							wearing={progress.skin === skin.id}
							coins={coins}
							onBuy={() => onBuySkin(skin.id, skin.price)}
							onWear={() => onWearSkin(skin.id)}
						/>
					))}
				</Stack>
				<Stack gap="sm">
					<Divider label="Looks: who swings" labelPosition="left" />
					{BATTERS.map((batter) => (
						<LookRow
							key={batter.id}
							look={batter}
							owned={progress.batters.includes(batter.id)}
							wearing={progress.batter === batter.id}
							coins={coins}
							onBuy={() => onBuyBatter(batter.id, batter.price)}
							onWear={() => onWearBatter(batter.id)}
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

type ILookRowProps = {
	look: { name: string; description: string; price: number };
	owned: boolean;
	wearing: boolean;
	coins: number;
	onBuy: () => void;
	onWear: () => void;
};

/** One look (a flyer or a batter): buy it, put it on, or a badge for the one in use. No effect on throws. */
function LookRow({ look, owned, wearing, coins, onBuy, onWear }: ILookRowProps) {
	return (
		<Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
			<div>
				<MantineText fw={700}>{look.name}</MantineText>
				<MantineText size="sm" c="dimmed">
					{look.description}
				</MantineText>
			</div>
			{wearing ? (
				<Badge variant="light" color="green" style={{ flex: "none" }}>
					In use
				</Badge>
			) : owned ? (
				<Button variant="secondary" size="xs" style={{ flex: "none" }} onClick={onWear}>
					Use
				</Button>
			) : (
				<Button
					variant="secondary"
					size="xs"
					style={{ flex: "none" }}
					leftSection={<FontAwesomeIcon icon={faCoins} />}
					disabled={coins < look.price}
					aria-label={`Buy ${look.name} for ${look.price} coins`}
					onClick={onBuy}
				>
					{look.price}
				</Button>
			)}
		</Group>
	);
}
