import { useRef } from "react";
import {
	Alert,
	Button,
	Group,
	Input,
	Loader,
	Modal,
	NumberInput,
	Rating,
	Stack,
	Text as MantineText,
	TextInput,
	Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import Emoji from "Components/Common/Emoji";
import { useLinkPreviewMutation, useSaveWishlistItemMutation } from "Components/Wishlist/hooks";
import WishlistItemImage from "Components/Wishlist/WishlistItemImage";
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
	imageUrl: string;
	price: number | string;
	notes: string;
	rating: number;
};

function initialValues(item: IWishlistItem | null): IFormValues {
	return {
		name: item?.name ?? "",
		url: item?.url ?? "",
		imageUrl: item?.imageUrl ?? "",
		price: item?.price ?? "",
		notes: item?.notes ?? "",
		rating: item?.rating ?? 3,
	};
}

export default function WishlistItemFormModal({ opened, item, onClose }: IWishlistItemFormModalProps) {
	const saveItem = useSaveWishlistItemMutation();
	const form = useForm<IFormValues>({ initialValues: initialValues(item) });
	const linkPreview = useLinkPreviewMutation();
	const lastLookedUp = useRef(item?.url ?? "");

	/** Fill in whatever the link's page tells us, but only into fields that are still empty. */
	function lookUpLink(url: string) {
		const trimmed = url.trim();

		if (!/^https?:\/\/\S+\.\S+/i.test(trimmed) || trimmed === lastLookedUp.current) {
			return;
		}

		lastLookedUp.current = trimmed;
		linkPreview.mutate(trimmed, {
			onSuccess: (preview) =>
				// Read the latest values: the person may have typed while we were fetching.
				form.setValues((current) => ({
					name: current.name?.trim() ? current.name : (preview.name ?? current.name),
					price: current.price === "" && preview.price !== null ? preview.price : current.price,
					imageUrl: current.imageUrl ? current.imageUrl : (preview.imageUrl ?? ""),
				})),
		});
	}

	function handleSubmit(values: IFormValues) {
		saveItem.mutate(
			{
				id: item?.id,
				details: {
					name: values.name.trim(),
					url: values.url.trim() || null,
					imageUrl: values.imageUrl || null,
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
					<TextInput
						label="Link"
						description="Paste a product link and we'll fill in any empty fields we can."
						placeholder="https://"
						type="url"
						data-autofocus={item ? undefined : true}
						rightSection={linkPreview.isPending ? <Loader size="xs" /> : undefined}
						{...form.getInputProps("url")}
						onBlur={(event) => lookUpLink(event.currentTarget.value)}
						onPaste={(event) => lookUpLink(event.clipboardData.getData("text"))}
					/>
					<TextInput
						label="What is it?"
						required
						data-autofocus={item ? true : undefined}
						{...form.getInputProps("name")}
					/>
					<Group gap="sm" wrap="nowrap">
						<WishlistItemImage src={form.values.imageUrl || null} alt="" size={64} />
						{form.values.imageUrl ? (
							<Button variant="subtle" color="gray" size="xs" onClick={() => form.setFieldValue("imageUrl", "")}>
								Remove image
							</Button>
						) : (
							<MantineText size="xs" c="dimmed">
								{linkPreview.isSuccess
									? "That page didn't share a picture."
									: "No image yet. Paste a link above and we'll grab the shop's picture if it has one."}
							</MantineText>
						)}
					</Group>
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
