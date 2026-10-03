import { useState } from "react";
import Emoji from "Components/Common/Emoji";
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
				<span className={classes.placeholder} style={{ fontSize: size * 0.45 }}>
					<Emoji>🎁</Emoji>
				</span>
			)}
		</div>
	);
}
