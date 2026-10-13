import type { ReactNode } from "react";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import GiftTagIcon from "Components/Common/FestiveIcons/GiftTagIcon";
import HollyIcon from "Components/Common/FestiveIcons/HollyIcon";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";

/** What the About page says, logged in or out. index.html's <noscript> copy repeats it. */
export const ABOUT_TAGLINE = "The easy way to run a gift exchange with family and friends. Free, with no ads.";

export type IAboutFeature = { icon: ReactNode; title: string; text: string };

export const ABOUT_FEATURES: IAboutFeature[] = [
	{
		icon: <GiftTagIcon />,
		title: "Draw names",
		text: "Start a group, invite everyone with a link or code, and draw names in one tap. Each person only sees who they're buying for.",
	},
	{
		icon: <WishListIcon />,
		title: "Share wishlists",
		text: "Keep one wishlist all year. Others claim what they'll buy so nobody doubles up, and you never see what's been claimed.",
	},
	{
		icon: <HollyIcon />,
		title: "Ask your Santa",
		text: "Ask the person you're buying for about sizes or hints without giving yourself away, and answer your own Santa's questions.",
	},
	{
		icon: <GiftBoxIcon />,
		title: "Kids and pets too",
		text: "Keep wishlists for kids and pets who don't have their own account, and add them to the draw.",
	},
];
