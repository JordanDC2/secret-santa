import { useState } from "react";
import { Accordion, Button, Container, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import { useDeleteWishlistItemMutation, useMyWishlistQuery } from "Components/Wishlist/hooks";
import type { IWishlistItem } from "Components/Wishlist/types";
import WishlistItemRow from "Components/Wishlist/WishlistItemRow";
import WishlistItemFormModal from "Components/Wishlist/WishlistItemFormModal";
import PageTitle from "Components/Layout/PageTitle";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Wishlist/WishlistPage.module.less";

type IModalState = { opened: boolean; item: IWishlistItem | null; key: number };

export default function MyWishlistPage() {
	const wishlistQuery = useMyWishlistQuery();
	const deleteItem = useDeleteWishlistItemMutation();
	const [modal, setModal] = useState<IModalState>({ opened: false, item: null, key: 0 });
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

	function openModal(item: IWishlistItem | null) {
		setModal((current) => ({ opened: true, item, key: current.key + 1 }));
	}

	return (
		<Container my={40}>
			<Stack gap="lg">
				<Group justify="space-between">
					<PageTitle icon={<WishListIcon />}>My wishlist</PageTitle>
					<Button leftSection={<FontAwesomeIcon icon={faPlus} />} onClick={() => openModal(null)}>
						Add item
					</Button>
				</Group>
				<MantineText c="dimmed">
					Everyone in your groups can see this list. Don&apos;t worry, you&apos;ll never see what&apos;s been claimed.
				</MantineText>

				{wishlistQuery.isPending && <MantineText c="dimmed">Loading your wishlist...</MantineText>}

				{wishlistQuery.isError && <MantineText c="red">{apiErrorMessage(wishlistQuery.error)}</MantineText>}

				{wishlistQuery.isSuccess && wishlistQuery.data.length === 0 && (
					<MantineText c="dimmed">
						Your list is empty. Add a few things so your Secret Santa isn&apos;t guessing!
					</MantineText>
				)}

				{wishlistQuery.isSuccess && wishlistQuery.data.length > 0 && (
					<Accordion variant="contained" radius="md" multiple className={classes.list}>
						{wishlistQuery.data.map((item) => (
							<WishlistItemRow
								key={item.id}
								item={item}
								actions={
									confirmingDeleteId === item.id ? (
										<>
											<MantineText size="sm">Remove this from your list?</MantineText>
											<Button
												size="xs"
												color="red"
												loading={deleteItem.isPending}
												onClick={() => deleteItem.mutate(item.id, { onSuccess: () => setConfirmingDeleteId(null) })}
											>
												Remove
											</Button>
											<Button size="xs" variant="subtle" color="gray" onClick={() => setConfirmingDeleteId(null)}>
												Cancel
											</Button>
										</>
									) : (
										<>
											<Button
												size="xs"
												variant="secondary"
												leftSection={<FontAwesomeIcon icon={faPenToSquare} />}
												onClick={() => openModal(item)}
											>
												Edit
											</Button>
											<Button
												size="xs"
												variant="subtle"
												color="red"
												leftSection={<FontAwesomeIcon icon={faTrashCan} />}
												onClick={() => setConfirmingDeleteId(item.id)}
											>
												Remove
											</Button>
										</>
									)
								}
							/>
						))}
					</Accordion>
				)}
			</Stack>

			<WishlistItemFormModal
				key={modal.key}
				opened={modal.opened}
				item={modal.item}
				onClose={() => setModal((current) => ({ ...current, opened: false }))}
			/>
		</Container>
	);
}
