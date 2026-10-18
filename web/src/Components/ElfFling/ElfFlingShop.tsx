import { useState } from "react";
import { Badge, Button, Divider, Group, Stack, Tabs, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faGem, faSnowflake } from "@fortawesome/free-solid-svg-icons";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import SectionCard from "Components/Common/SectionCard";
import {
	CHRISTMAS_BONUS,
	nextCoinPrice,
	nextGemPrice,
	prestigeGems,
	SHOP_GROUPS,
	SHOP_ITEMS,
	type IShopItem,
	type IUpgradeId,
} from "Components/ElfFling/upgrades";
import type { IProgress } from "Components/ElfFling/progress";
import { BATTERS, SKINS, type IBatterId, type ISkinId } from "Components/ElfFling/skins";
import { letGoOfFocus, releaseFocus } from "Components/ElfFling/releaseFocus";
import classes from "Components/ElfFling/ElfFling.module.less";

type IElfFlingShopProps = {
	progress: IProgress;
	/** While a purchase or change is saving, the buttons wait. */
	busy: boolean;
	onBuy: (id: IUpgradeId) => void;
	onBuyGemUpgrade: (id: IUpgradeId | "christmasBonus") => void;
	onPrestige: () => void;
	onBuySkin: (id: ISkinId) => void;
	onWearSkin: (id: ISkinId) => void;
	onBuyBatter: (id: IBatterId) => void;
	onWearBatter: (id: IBatterId) => void;
	/** On a phone, keyboard shortcuts aren't mentioned. */
	touchScreen: boolean;
	/** In the drawer over the game, whose own header shows the title and balance (pinned while
	    the list scrolls), so the shop goes without its card. */
	inDrawer?: boolean;
};

type IShopTab = "coins" | "gems";

/**
 * The coin shop (upgrades in sections: the swing, landings, in the air, coins; then wrapping up
 * Christmas, and looks) and, once the player has wrapped up a Christmas, a second tab: the gem
 * shop, the same upgrades kept for good.
 */
export default function ElfFlingShop({
	progress,
	busy,
	onBuy,
	onBuyGemUpgrade,
	onPrestige,
	onBuySkin,
	onWearSkin,
	onBuyBatter,
	onWearBatter,
	touchScreen,
	inDrawer = false,
}: IElfFlingShopProps) {
	const { coins, gems, upgrades, gemUpgrades, prestiges } = progress;
	const describe = (item: IShopItem) =>
		!touchScreen && item.keyboardHint ? `${item.description} ${item.keyboardHint}` : item.description;
	const [tab, setTab] = useState<IShopTab>("coins");

	const coinShop = (
		<Stack gap="md">
			{SHOP_GROUPS.map((group) => (
				<Stack key={group} gap="sm">
					<Divider label={group} labelPosition="left" />
					{SHOP_ITEMS.filter((item) => item.group === group).map((item) => (
						<ShopRow
							key={item.id}
							name={item.name}
							description={describe(item)}
							level={upgrades[item.id]}
							levels={item.prices.length}
							keptLevels={gemUpgrades[item.id]}
							stacks={item.gemStacks}
							price={nextCoinPrice(item, upgrades[item.id], gemUpgrades[item.id])}
							currency="coins"
							balance={coins}
							busy={busy}
							onBuy={() => onBuy(item.id)}
						/>
					))}
				</Stack>
			))}
			<WrapUpChristmas progress={progress} busy={busy} onPrestige={onPrestige} />
			<Stack gap="sm">
				<Divider label="Looks: who gets flung" labelPosition="left" />
				{SKINS.map((skin) => (
					<LookRow
						key={skin.id}
						look={skin}
						owned={progress.skins.includes(skin.id)}
						wearing={progress.skin === skin.id}
						coins={coins}
						busy={busy}
						onBuy={() => onBuySkin(skin.id)}
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
						busy={busy}
						onBuy={() => onBuyBatter(batter.id)}
						onWear={() => onWearBatter(batter.id)}
					/>
				))}
			</Stack>
			<MantineText size="xs" c="dimmed">
				Coins, gems, upgrades and looks are saved with your account, on every device.
			</MantineText>
		</Stack>
	);

	const gemShop = (
		<Stack gap="md">
			<MantineText size="sm" c="dimmed">
				The same upgrades, kept for good: wrapping up a Christmas never takes these away. Levels bought here go on top
				of the coin shop&apos;s.
			</MantineText>
			<Stack gap="sm">
				<Divider label="Gem shop only" labelPosition="left" />
				<ShopRow
					name={CHRISTMAS_BONUS.name}
					description={CHRISTMAS_BONUS.description}
					level={gemUpgrades.christmasBonus}
					levels={CHRISTMAS_BONUS.gemPrices.length}
					price={CHRISTMAS_BONUS.gemPrices[gemUpgrades.christmasBonus] ?? null}
					currency="gems"
					balance={gems}
					busy={busy}
					onBuy={() => onBuyGemUpgrade("christmasBonus")}
				/>
			</Stack>
			{SHOP_GROUPS.map((group) => (
				<Stack key={group} gap="sm">
					<Divider label={group} labelPosition="left" />
					{SHOP_ITEMS.filter((item) => item.group === group).map((item) => (
						<ShopRow
							key={item.id}
							name={item.name}
							description={describe(item)}
							level={gemUpgrades[item.id]}
							levels={item.gemPrices.length}
							price={nextGemPrice(item, gemUpgrades[item.id])}
							currency="gems"
							balance={gems}
							busy={busy}
							onBuy={() => onBuyGemUpgrade(item.id)}
						/>
					))}
				</Stack>
			))}
		</Stack>
	);

	// The gem shop opens with the first Christmas wrapped up; until then it's just the coin shop.
	const items =
		prestiges === 0 ? (
			coinShop
		) : (
			<Tabs
				color="var(--festive-gold-deep)"
				classNames={{ tab: classes.festiveTab }}
				value={tab}
				onChange={(value) => {
					if (value) {
						setTab(value as IShopTab);
						letGoOfFocus();
					}
				}}
			>
				<Tabs.List grow mb="md">
					<Tabs.Tab value="coins" leftSection={<FontAwesomeIcon icon={faCoins} />}>
						Coin shop
					</Tabs.Tab>
					<Tabs.Tab value="gems" leftSection={<FontAwesomeIcon icon={faGem} />}>
						Gem shop
					</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="coins">{coinShop}</Tabs.Panel>
				<Tabs.Panel value="gems">{gemShop}</Tabs.Panel>
			</Tabs>
		);

	if (inDrawer) {
		return items;
	}

	return (
		<SectionCard title="Shop" action={<Balances progress={progress} />}>
			{items}
		</SectionCard>
	);
}

/**
 * The coin balance, and the gem balance once the player has wrapped up a Christmas. Compact
 * (the icons alone say which is which) where space is tight, like the drawer's header on a phone.
 */
export function Balances({ progress, compact = false }: { progress: IProgress; compact?: boolean }) {
	const coins = `${progress.coins} ${progress.coins === 1 ? "coin" : "coins"}`;
	const gems = `${progress.gems} ${progress.gems === 1 ? "gem" : "gems"}`;

	return (
		<Group gap="xs" wrap="nowrap">
			<Badge
				size="lg"
				className={classes.coins}
				leftSection={<FontAwesomeIcon icon={faCoins} />}
				aria-label={compact ? coins : undefined}
			>
				{compact ? progress.coins : coins}
			</Badge>
			{progress.prestiges > 0 && (
				<Badge
					size="lg"
					className={classes.gems}
					leftSection={<FontAwesomeIcon icon={faGem} />}
					aria-label={compact ? gems : undefined}
				>
					{compact ? progress.gems : gems}
				</Badge>
			)}
		</Group>
	);
}

type IWrapUpChristmasProps = {
	progress: IProgress;
	busy: boolean;
	onPrestige: () => void;
};

/**
 * Prestige: spare coins become gems, and the coin shop starts over. Asks first, since it takes
 * every coin upgrade away.
 */
function WrapUpChristmas({ progress, busy, onPrestige }: IWrapUpChristmasProps) {
	const [confirming, setConfirming] = useState(false);
	const gems = prestigeGems(progress.coins);
	const nextChristmas = progress.prestiges + 2;

	return (
		<Stack gap="sm">
			<Divider label="Wrap up Christmas" labelPosition="left" />
			<MantineText size="sm" c="dimmed">
				Turn your spare coins into gems and start Christmas {nextChristmas}. Gems buy upgrades you keep for good. Your
				coins and coin-shop upgrades go back to nothing; gems, gem-shop upgrades and looks stay.
			</MantineText>
			{confirming ? (
				<Group gap="sm" wrap="wrap">
					<MantineText size="sm" fw={700}>
						Swap {progress.coins} coins for {gems} {gems === 1 ? "gem" : "gems"} and start over?
					</MantineText>
					<ConfirmButtons
						size="xs"
						confirmLabel="Wrap it up"
						isPending={busy}
						onCancel={() => setConfirming(false)}
						onConfirm={() => {
							onPrestige();
							setConfirming(false);
						}}
					/>
				</Group>
			) : (
				<Group justify="space-between" wrap="nowrap" gap="md">
					<MantineText size="sm" fw={700}>
						{gems > 0 ? `Worth ${gems} ${gems === 1 ? "gem" : "gems"} now` : "Save up at least 10 coins to make a gem"}
					</MantineText>
					<Button
						variant="secondary"
						size="xs"
						style={{ flex: "none" }}
						leftSection={<FontAwesomeIcon icon={faSnowflake} />}
						disabled={busy || gems < 1}
						onClick={(event) => {
							setConfirming(true);
							releaseFocus(event);
						}}
					>
						Wrap up this Christmas
					</Button>
				</Group>
			)}
		</Stack>
	);
}

type IShopRowProps = {
	name: string;
	description: string;
	/** Levels bought in this shop, out of how many it sells. */
	level: number;
	levels: number;
	/** In the coin shop: levels kept from the gem shop, and whether they go on top or stand in. */
	keptLevels?: number;
	stacks?: boolean;
	/** The next level's price, or null if there's nothing more to buy here. */
	price: number | null;
	currency: "coins" | "gems";
	balance: number;
	busy: boolean;
	onBuy: () => void;
};

/** One upgrade: what it does, the levels owned, and a buy button with the next price. */
function ShopRow({
	name,
	description,
	level,
	levels,
	keptLevels = 0,
	stacks = false,
	price,
	currency,
	balance,
	busy,
	onBuy,
}: IShopRowProps) {
	const hasLevels = levels > 1;
	// Owned through the gem shop: nothing to buy here, and it outlasts prestige.
	const keptInstead = !stacks && keptLevels > 0 && price === null;

	return (
		<Group justify="space-between" wrap="nowrap" align="flex-start" gap="md">
			<div>
				<Group gap="xs">
					<MantineText fw={700}>{name}</MantineText>
					{hasLevels && level > 0 && (
						<Badge size="sm" variant="light" color="gray">
							Level {level} of {levels}
						</Badge>
					)}
					{stacks && keptLevels > 0 && (
						<Badge size="sm" variant="light" color="red" leftSection={<FontAwesomeIcon icon={faGem} />}>
							+{keptLevels} kept
						</Badge>
					)}
				</Group>
				<MantineText size="sm" c="dimmed">
					{description}
				</MantineText>
			</div>
			{price === null ? (
				<Badge variant="light" color={keptInstead ? "red" : "green"} style={{ flex: "none" }}>
					{keptInstead ? "Kept" : hasLevels ? "Maxed" : "Owned"}
				</Badge>
			) : (
				<Button
					variant="secondary"
					size="xs"
					style={{ flex: "none" }}
					leftSection={<FontAwesomeIcon icon={currency === "gems" ? faGem : faCoins} />}
					disabled={busy || balance < price}
					aria-label={`Buy ${name}${hasLevels ? ` level ${level + 1}` : ""} for ${price} ${currency}`}
					onClick={(event) => {
						onBuy();
						releaseFocus(event);
					}}
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
	busy: boolean;
	onBuy: () => void;
	onWear: () => void;
};

/** One look (a flyer or a batter): buy it, put it on, or a badge for the one in use. No effect on throws. */
function LookRow({ look, owned, wearing, coins, busy, onBuy, onWear }: ILookRowProps) {
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
				<Button
					variant="secondary"
					size="xs"
					style={{ flex: "none" }}
					disabled={busy}
					onClick={(event) => {
						onWear();
						releaseFocus(event);
					}}
				>
					Use
				</Button>
			) : (
				<Button
					variant="secondary"
					size="xs"
					style={{ flex: "none" }}
					leftSection={<FontAwesomeIcon icon={faCoins} />}
					disabled={busy || coins < look.price}
					aria-label={`Buy ${look.name} for ${look.price} coins`}
					onClick={(event) => {
						onBuy();
						releaseFocus(event);
					}}
				>
					{look.price}
				</Button>
			)}
		</Group>
	);
}
