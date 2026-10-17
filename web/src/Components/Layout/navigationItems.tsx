import type { ComponentType } from "react";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import HollyIcon from "Components/Common/FestiveIcons/HollyIcon";
import SnowflakeIcon from "Components/Common/FestiveIcons/SnowflakeIcon";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import type { IFestiveIconProps } from "Components/Common/FestiveIcons/FestiveSvg";

type INavigationItem = {
	to: string;
	label: string;
	icon: ComponentType<IFestiveIconProps>;
	/** Only the site's owner sees it. */
	adminOnly?: boolean;
};

/** The signed-in pages, in the header's row (wide screens) and its menu (phones). */
export const navigationItems: INavigationItem[] = [
	{ to: "/wishlist", label: "My wishlist", icon: WishListIcon },
	{ to: "/games", label: "Games", icon: GiftBoxIcon },
	{ to: "/admin", label: "Admin", icon: HollyIcon, adminOnly: true },
	{ to: "/settings", label: "Settings", icon: SnowflakeIcon },
];
