import { useState } from "react";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import classes from "Components/Wishlist/WishlistItemImage.module.less";

type IWishlistItemImageProps = {
	src: string | null;
	alt: string;
	size: number;
};

/**
 * The shop's product image, or a gift placeholder when there isn't one or it fails to load.
 * no-referrer: the shop doesn't learn which wishlist page the image was shown on.
 */
export default function WishlistItemImage({ src, alt, size }: IWishlistItemImageProps) {
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const showImage = src && failedSrc !== src;

	return (
		<div className={classes.frame} style={{ width: size, height: size }}>
			{showImage ? (
				<img
					src={src}
					alt={alt}
					className={classes.image}
					loading="lazy"
					referrerPolicy="no-referrer"
					onError={() => setFailedSrc(src)}
				/>
			) : (
				<span className={classes.placeholder}>
					<GiftBoxIcon size={size * 0.55} />
				</span>
			)}
		</div>
	);
}
