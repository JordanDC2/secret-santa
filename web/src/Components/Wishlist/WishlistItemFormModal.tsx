import { Alert, Button, Group, Input, Modal, NumberInput, Rating, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import Emoji from "Components/Common/Emoji";
import { useSaveWishlistItemMutation } from "Components/Wishlist/hooks";
import type { IWishlistItem } from "Components/Wishlist/types";
import { apiErrorMessage } from "Data/Api/Client";

/** Give this a fresh `key` each time it opens so the form starts from `item`. */
type IWishlistItemFormModalProps = {
	opened: boolean;
	/** The item being edited, or null to add a new one. */
	item: IWishlistItem | null;
	onClose: () => void;
};

type IFormValues = {
	name: string;
	url: string;
	price: number | string;
	notes: string;
	rating: number;
};

function initialValues(item: IWishlistItem | null): IFormValues {
	return {
		name: item?.name ?? "",
		url: item?.url ?? "",
		price: item?.price ?? "",
		notes: item?.notes ?? "",
		rating: item?.rating ?? 3,
	};
}

export default function WishlistItemFormModal({ opened, item, onClose }: IWishlistItemFormModalProps) {
	const saveItem = useSaveWishlistItemMutation();
	const form = useForm<IFormValues>({ initialValues: initialValues(item) });

	function handleSubmit(values: IFormValues) {
		saveItem.mutate(
			{
				id: item?.id,
				details: {
					name: values.name.trim(),
					url: values.url.trim() || null,
					price: values.price === "" ? null : Number(values.price),
					notes: values.notes.trim() || null,
					rating: values.rating,
				},
			},
			{ onSuccess: onClose },
		);
	}

	return (
		<Modal opened={opened} onClose={onClose} title={item ? "Edit item" : "Add to your wishlist"} centered>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{saveItem.isError && <Alert color="red">{apiErrorMessage(saveItem.error)}</Alert>}
					<TextInput label="What is it?" required data-autofocus {...form.getInputProps("name")} />
					<TextInput label="Link" placeholder="https://" type="url" {...form.getInputProps("url")} />
					<NumberInput
						label="Price"
						prefix="$"
						min={0}
						decimalScale={2}
						fixedDecimalScale
						thousandSeparator=","
						{...form.getInputProps("price")}
					/>
					<Textarea
						label="Notes"
						placeholder="Size, color, model, anything that helps"
						autosize
						minRows={2}
						{...form.getInputProps("notes")}
					/>
					<Input.Wrapper label="How much do you want it?">
						<Rating
							size="lg"
							getSymbolLabel={(stars) => `${stars} star${stars === 1 ? "" : "s"}`}
							{...form.getInputProps("rating")}
						/>
					</Input.Wrapper>
					<Group justify="flex-end">
						<Button variant="subtle" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							color="red"
							loading={saveItem.isPending}
							leftSection={item ? undefined : <Emoji>🎁</Emoji>}
						>
							{item ? "Save" : "Add item"}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
