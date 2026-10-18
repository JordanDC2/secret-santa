import { useState } from "react";
import { Badge, Button, Divider, Group, Stack, Tabs, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faGem, faSnowflake } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";
import {
	COCOA_JUMPS,
	GINGERBREAD_BURST,
	GLIDE_SINK,
	POWER_UP_SECONDS,
	SNOWBALL_FRICTION,
	SNOWBALL_REACH,
	TAILWIND,
	type ITimedPowerUpKind,
} from "Components/ElfFling/powerUps";
import { CHIMNEY_LAUNCH } from "Components/ElfFling/chimneys";
import { GUST_PUSH, UPDRAFT_LIFT } from "Components/ElfFling/weather";
import { LOG_SPEEDS } from "Components/ElfFling/yuleLogs";
import {
	airDragShare,
	bounceKeep,
	combinedUpgrades,
	ENDLESS_FROM_PRESTIGE,
	ENDLESS_ITEMS,
	GEM_ONLY_ITEMS,
	gemOnlyPrices,
	magnetRadius,
	NO_THROW_UPGRADES,
	snowFriction,
	snowmanKeep,
	swingMultiplier,
	swingReach,
	POWER_UP_ITEMS,
	nextCoinPrice,
	nextGemPrice,
	prestigeGems,
	SANTAS_LEDGER,
	SHOP_GROUPS,
	SHOP_ITEMS,
	type IGemOnlyId,
	type IGemUpgrades,
	type IShopItem,
	type IUpgradeId,
} from "Components/ElfFling/upgrades";
import type { IProgress } from "Components/ElfFling/progress";
import { BATTERS, SKINS, type IBatterId, type ISkinId } from "Components/ElfFling/skins";
import { letGoOfFocus, releaseFocus } from "Components/ElfFling/releaseFocus";
import classes from "Components/ElfFling/ElfFling.module.less";
import EndlessUpgrades from "Components/ElfFling/EndlessUpgrades";
import ShopRow, { type IShopRowProps } from "Components/ElfFling/ShopRow";

type IElfFlingShopProps = {
	progress: IProgress;
	/** While a purchase or change is saving, the buttons wait. */
	busy: boolean;
	/** count: how many levels at once (the endless upgrades' ×5). */
	onBuy: (id: IUpgradeId, count?: number) => void;
	/** count: how many levels at once (Santa's ledger's ×5 and Max). */
	onBuyGemUpgrade: (id: IUpgradeId | IGemOnlyId, count?: number) => void;
	/** Opens the hold-to-confirm over the game (WrapUpHold.tsx). */
	onWrapUp: () => void;
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
	onWrapUp,
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
			<WrapUpChristmas progress={progress} busy={busy} onWrapUp={onWrapUp} />
			{prestiges >= ENDLESS_FROM_PRESTIGE && (
				<EndlessUpgrades
					label="Endless upgrades"
					items={ENDLESS_ITEMS}
					level={(id) => upgrades[id]}
					currency="coins"
					balance={coins}
					busy={busy}
					onBuy={(id, count) => onBuy(id, count)}
				/>
			)}
			{SHOP_GROUPS.map((group) => (
				<Stack key={group} gap="sm">
					<Divider label={group} labelPosition="left" />
					{SHOP_ITEMS.filter((item) => item.group === group).map((item) => (
						<ShopRow
							key={item.id}
							name={item.name}
							description={describe(item)}
							{...coinRowLevels(item, upgrades[item.id], gemUpgrades[item.id])}
							effect={coinEffect(item, progress)}
							price={nextCoinPrice(item, upgrades[item.id], gemUpgrades[item.id])}
							currency="coins"
							balance={coins}
							busy={busy}
							onBuy={() => onBuy(item.id)}
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

	const gemRow = (item: IShopItem) => (
		<ShopRow
			key={item.id}
			name={item.gem.name}
			description={item.gem.description}
			level={gemUpgrades[item.id]}
			levels={item.gem.prices.length}
			doneLabel={item.gem.kind === "keep" ? "Kept" : undefined}
			effect={gemEffect(item.id, progress)}
			price={nextGemPrice(item, gemUpgrades[item.id])}
			currency="gems"
			balance={gems}
			busy={busy}
			onBuy={() => onBuyGemUpgrade(item.id)}
		/>
	);
	const gemShop = (
		<Stack gap="md">
			<MantineText size="sm" c="dimmed">
				Everything here stays when you wrap up a Christmas.
			</MantineText>
			<EndlessUpgrades
				label="Endless"
				items={[SANTAS_LEDGER]}
				level={(id) => gemUpgrades[id]}
				currency="gems"
				balance={gems}
				busy={busy}
				onBuy={(id, count) => onBuyGemUpgrade(id, count)}
			/>
			<Stack gap="sm">
				<Divider label="Gem shop only" labelPosition="left" />
				{GEM_ONLY_ITEMS.map((item) => (
					<ShopRow
						key={item.id}
						name={item.name}
						description={item.description}
						effect={gemEffect(item.id, progress)}
						level={gemUpgrades[item.id]}
						levels={gemOnlyPrices(item.id, prestiges).length}
						price={gemOnlyPrices(item.id, prestiges)[gemUpgrades[item.id]] ?? null}
						currency="gems"
						balance={gems}
						busy={busy}
						onBuy={() => onBuyGemUpgrade(item.id)}
					/>
				))}
			</Stack>
			<Stack gap="sm">
				<Divider label="Power-ups" labelPosition="left" />
				{POWER_UP_ITEMS.map((item) => (
					<ShopRow
						key={item.id}
						name={item.name}
						description={item.description}
						effect={gemEffect(item.id, progress)}
						level={gemUpgrades[item.id]}
						levels={item.prices.length}
						price={item.prices[gemUpgrades[item.id]] ?? null}
						currency="gems"
						balance={gems}
						busy={busy}
						onBuy={() => onBuyGemUpgrade(item.id)}
					/>
				))}
			</Stack>
			<Stack gap="sm">
				<Divider label="Extra levels" labelPosition="left" />
				{SHOP_ITEMS.filter((item) => item.gem.kind === "extra").map(gemRow)}
			</Stack>
			<Stack gap="sm">
				<Divider label="Keep through Christmas" labelPosition="left" />
				<MantineText size="sm" c="dimmed">
					The coin shop&apos;s own levels, kept when you wrap up Christmas so they never need buying again.
				</MantineText>
				{SHOP_ITEMS.filter((item) => item.gem.kind === "keep").map(gemRow)}
			</Stack>
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
		<SectionCard title="Shop" action={<Balances progress={progress} compact />}>
			{items}
		</SectionCard>
	);
}

/**
 * The coin balance, and the gem balance once the player has wrapped up a Christmas. Compact
 * (the icons alone say which is which) where space is tight, like the drawer's header on a phone.
 */
export function Balances({ progress, compact = false }: { progress: IProgress; compact?: boolean }) {
	const coins = `${progress.coins.toLocaleString()} ${progress.coins === 1 ? "coin" : "coins"}`;
	const gems = `${progress.gems.toLocaleString()} ${progress.gems === 1 ? "gem" : "gems"}`;

	return (
		<Group gap="xs" wrap="nowrap">
			<Badge
				size="lg"
				className={classes.coins}
				leftSection={<FontAwesomeIcon icon={faCoins} />}
				aria-label={compact ? coins : undefined}
			>
				{compact ? progress.coins.toLocaleString() : coins}
			</Badge>
			{progress.prestiges > 0 && (
				<Badge
					size="lg"
					className={classes.gems}
					leftSection={<FontAwesomeIcon icon={faGem} />}
					aria-label={compact ? gems : undefined}
				>
					{compact ? progress.gems.toLocaleString() : gems}
				</Badge>
			)}
		</Group>
	);
}

type IWrapUpChristmasProps = {
	progress: IProgress;
	busy: boolean;
	onWrapUp: () => void;
};

/**
 * Prestige: spare coins become gems, and the coin shop starts over. The button only opens the
 * hold-to-confirm over the game, since it takes every coin upgrade away.
 */
function WrapUpChristmas({ progress, busy, onWrapUp }: IWrapUpChristmasProps) {
	const gems = prestigeGems(progress.coins);
	const nextChristmas = progress.prestiges + 2;

	return (
		<Stack gap="sm">
			<Divider label="Wrap up Christmas" labelPosition="left" />
			<MantineText size="sm" c="dimmed">
				Turn your spare coins into gems and start Christmas {nextChristmas}. Gems buy upgrades you keep for good. Your
				coins and coin-shop upgrades go back to nothing; gems, gem-shop upgrades and looks stay.
			</MantineText>
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
						onWrapUp();
						releaseFocus(event);
					}}
				>
					Wrap up this Christmas
				</Button>
			</Group>
		</Stack>
	);
}

/** What each power-up does, in numbers (powerUps.ts and the physics apply them). */
const POWER_UP_EFFECTS: Record<ITimedPowerUpKind, string> = {
	christmasStar: "Bounces keep: 100% of their speed",
	gingerbreadMan: `Burst: +${GINGERBREAD_BURST} m/s · Air drag: none`,
	snowAngelWings: `Fastest fall: ${GLIDE_SINK} m/s`,
	giantSnowball: `Reach: +${SNOWBALL_REACH} m · Slide friction: −${Math.round((1 - SNOWBALL_FRICTION) * 100)}%`,
	northWind: `Tailwind: +${TAILWIND.forward} m/s² forward, +${TAILWIND.up} m/s² up`,
};

/**
 * A gem-shop upgrade's effect in numbers, from the player's own levels (coin shop included):
 * "Lasts: 5 s at level 1" before buying, "Lasts: 5 s now, 7.5 s at level 2" part way, and just
 * "Lasts: 10 s" when maxed. Null where there's no number to show (the keep items).
 */
function gemEffect(id: IUpgradeId | IGemOnlyId, progress: IProgress): string | null {
	const level = progress.gemUpgrades[id];
	// The throw's numbers if this one were at `at` levels.
	const at = (gemLevel: number) =>
		combinedUpgrades(progress.upgrades, { ...progress.gemUpgrades, [id]: gemLevel } as IGemUpgrades);
	const describe = (label: string, levels: number, value: (gemLevel: number) => string) =>
		effectLine(label, level, levels, value);

	switch (id) {
		case "christmasStar":
		case "gingerbreadMan":
		case "snowAngelWings":
		case "giantSnowball":
		case "northWind":
			return `${POWER_UP_EFFECTS[id]} · ${describe("Lasts", POWER_UP_SECONDS[id].length, (gemLevel) => `${POWER_UP_SECONDS[id][gemLevel - 1]} s`)}`;
		case "hotCocoa":
			return describe("Extra jumps", COCOA_JUMPS.length, (gemLevel) => `+${COCOA_JUMPS[gemLevel - 1]}`);
		case "spareFirework":
			return "Rockets: +1 for every firework you grab";
		case "yuleLog":
			return describe("Fires you out at", LOG_SPEEDS.length, (gemLevel) => `${LOG_SPEEDS[gemLevel - 1]} m/s`);
		case "chimney":
			return `Out at: ${CHIMNEY_LAUNCH.forward} m/s forward, ${CHIMNEY_LAUNCH.up} m/s up`;
		case "highWinds":
			return `Push: +${GUST_PUSH} m/s² forward`;
		case "updrafts":
			return `Lift: +${UPDRAFT_LIFT} m/s² up`;
		case "offSeasonTraining":
			return `Launch speed: +${Math.round((swingMultiplier({ ...NO_THROW_UPGRADES, offSeasonTraining: 1 }) - 1) * 100)}%`;
		case "polarJetStream":
			return `Air drag: −${Math.round((1 - airDragShare({ ...NO_THROW_UPGRADES, polarJetStream: 1 })) * 100)}%`;
		case "christmasBonus":
			return describe(
				"Banked coins",
				gemOnlyPrices(id, progress.prestiges).length,
				(gemLevel) => `×${(2 ** gemLevel).toLocaleString()}`,
			);
		case "springyBoots":
			return describe(
				"Bounces keep",
				1,
				(gemLevel) => `${Math.round(bounceKeep(at(gemLevel)).vertical * 100)}% of their height`,
			);
		case "candyMagnet":
			return describe("Reach", 1, (gemLevel) => `${magnetRadius(at(gemLevel))} m`);
		case "luckyStocking":
			return describe("Extra on banked coins", 1, (gemLevel) => `+${at(gemLevel).luckyStocking * 25}%`);
		default:
			return null;
	}
}

/**
 * A coin-shop upgrade's effect in numbers, the same way as gemEffect, counting any gem levels
 * the player has (extra levels on top, kept levels as bought). Null where there's no number
 * to show (most single purchases).
 */
function coinEffect(item: IShopItem, progress: IProgress): string | null {
	const { id } = item;
	const { level } = coinRowLevels(item, progress.upgrades[id], progress.gemUpgrades[id]);
	// The throw's numbers with the row at `rowLevel`: kept levels are already counted in it.
	const at = (rowLevel: number) =>
		combinedUpgrades(
			{ ...progress.upgrades, [id]: rowLevel },
			item.gem.kind === "keep" ? { ...progress.gemUpgrades, [id]: 0 } : progress.gemUpgrades,
		);
	const describe = (label: string, value: (rowLevel: number) => string) =>
		effectLine(label, level, item.prices.length, value);

	switch (id) {
		case "swingStrength":
			return describe("Launch speed", (n) => `+${at(n).swingStrength * 7}%`);
		case "goldenCane":
			return describe("Sweet spot", (n) => `±${swingReach(at(n)).toFixed(2)} m`);
		case "sledRunners":
			return describe("Slide friction", (n) => `−${Math.round((1 - snowFriction(at(n)) / 4) * 100)}%`);
		case "springyBoots":
			return describe("Bounces keep", (n) => `${Math.round(bounceKeep(at(n)).vertical * 100)}% of their height`);
		case "paddedSuit":
			return describe("Speed kept after a snowman", (n) => `${Math.round(snowmanKeep(at(n)) * 100)}%`);
		case "elfJump":
			return describe("Jumps per throw", (n) => `${at(n).elfJump}`);
		case "candyMagnet":
			return describe("Reach", (n) => `${magnetRadius(at(n))} m`);
		case "luckyStocking":
			return describe("Extra on banked coins", (n) => `+${at(n).luckyStocking * 25}%`);
		case "rocket":
			return "Rockets per throw: 1";
		default:
			return null;
	}
}

/**
 * "Label: X at level 1" before buying, "Label: X now, Y at level 2" part way, and just
 * "Label: X" when maxed. value(n) is the effect at level n.
 */
function effectLine(label: string, level: number, levels: number, value: (level: number) => string): string {
	if (level === 0) {
		return `${label}: ${value(1)} at level 1`;
	}

	return level >= levels
		? `${label}: ${value(level)}`
		: `${label}: ${value(level)} now, ${value(level + 1)} at level ${level + 1}`;
}

/**
 * How a coin-shop row shows its levels alongside the gem shop's. Extra gem levels show as a note
 * ("+1 extra") beside the coin levels; kept levels count as bought, and once all are kept
 * there's nothing to buy with coins ("Kept").
 */
function coinRowLevels(
	item: IShopItem,
	coinLevel: number,
	gemLevel: number,
): Pick<IShopRowProps, "level" | "levels" | "note" | "doneLabel"> {
	const levels = item.prices.length;

	if (item.gem.kind === "extra") {
		return { level: coinLevel, levels, note: gemLevel > 0 ? `+${gemLevel} extra` : null };
	}

	const allKept = gemLevel >= levels;

	return {
		level: Math.min(levels, coinLevel + gemLevel),
		levels,
		note: gemLevel > 0 && !allKept ? `${gemLevel} kept` : null,
		doneLabel: allKept ? "Kept" : undefined,
	};
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
