import type { ReactNode } from "react";
import { Accordion, Button, Group, Rating, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import type { IWishlistItem } from "Components/Wishlist/types";
import WishlistItemImage from "Components/Wishlist/WishlistItemImage";
import classes from "Components/Wishlist/WishlistItemRow.module.less";

const priceFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type IWishlistItemRowProps = {
	item: IWishlistItem;
	/** Non-interactive status shown in the collapsed row, e.g. a "Claimed" badge. */
	status?: ReactNode;
	/** Buttons shown when the row is expanded, e.g. edit/remove or claim. */
	actions?: ReactNode;
	dimmed?: boolean;
};

/** One row of a wishlist <Accordion>: a compact summary that expands to show details. */
export default function WishlistItemRow({ item, status, actions, dimmed = false }: IWishlistItemRowProps) {
	return (
		<Accordion.Item value={String(item.id)} className={dimmed ? classes.dimmed : undefined}>
			<Accordion.Control>
				<Group justify="space-between" gap="xs">
					<Group gap="sm" wrap="nowrap" className={classes.name}>
						<WishlistItemImage src={item.imageUrl} alt="" size={44} />
						{/* The claim status sits under the name so it never gets squeezed on phones. */}
						<Stack gap={4} className={classes.name}>
							<MantineText fw={600}>
								{item.name}
								{item.quantity > 1 && (
									<MantineText span c="dimmed" fw={500}>
										{" "}
										×{item.quantity}
									</MantineText>
								)}
							</MantineText>
							{status && <div>{status}</div>}
						</Stack>
					</Group>
					<Group gap="sm" wrap="nowrap">
						{item.price !== null && (
							<MantineText size="sm" fw={600} className={classes.price}>
								{priceFormatter.format(item.price)}
							</MantineText>
						)}
						<Rating value={item.rating} readOnly size="sm" aria-label={`${item.rating} out of 5 stars`} />
					</Group>
				</Group>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack gap="sm">
					<Group gap="md" align="flex-start" wrap="nowrap">
						{item.imageUrl && <WishlistItemImage src={item.imageUrl} alt={item.name} size={120} />}
						<MantineText size="sm" c={item.notes ? undefined : "dimmed"} className={classes.notes}>
							{item.notes ?? "No notes."}
						</MantineText>
					</Group>
					<Group justify="space-between" gap="xs">
						{item.url ? (
							<Button
								component="a"
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								variant="light"
								size="xs"
								rightSection={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
							>
								Visit site
							</Button>
						) : (
							<span />
						)}
						<Group gap="xs">{actions}</Group>
					</Group>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
