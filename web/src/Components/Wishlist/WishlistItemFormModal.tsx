import {
	Alert,
	Button,
	Group,
	Input,
	Modal,
	NumberInput,
	Rating,
	Stack,
	Text as MantineText,
	TextInput,
	Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import {
	useLinkPreviewMutation,
	useSaveSuggestionMutation,
	useSaveWishlistItemMutation,
} from "Components/Wishlist/hooks";
import WishlistItemImage from "Components/Wishlist/WishlistItemImage";
import type { IWishlistItem, IWishlistPerson } from "Components/Wishlist/types";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Wishlist/WishlistItemFormModal.module.less";

/** Give this a fresh `key` each time it opens so the form starts from `item`. */
type IWishlistItemFormModalProps = {
	opened: boolean;
	/** The item being edited, or null to add a new one. */
	item: IWishlistItem | null;
	/** Set when this is a gift idea for someone else's list: no star rating, and saved as a suggestion. */
	suggestionFor?: IWishlistPerson;
	/** Adding to a kid's or pet's list you manage, rather than your own. */
	managedFor?: IWishlistPerson;
	onClose: () => void;
};

type IFormValues = {
	name: string;
	url: string;
	imageUrl: string;
	price: number | string;
	quantity: number | string;
	notes: string;
	rating: number;
};

function initialValues(item: IWishlistItem | null): IFormValues {
	return {
		name: item?.name ?? "",
		url: item?.url ?? "",
		imageUrl: item?.imageUrl ?? "",
		price: item?.price ?? "",
		quantity: item?.quantity ?? 1,
		notes: item?.notes ?? "",
		rating: item?.rating ?? 3,
	};
}

function modalTitle(item: IWishlistItem | null, suggestionFor?: IWishlistPerson, managedFor?: IWishlistPerson) {
	if (suggestionFor) {
		return item ? "Edit gift idea" : `Suggest a gift for ${suggestionFor.name}`;
	}

	if (item) {
		return "Edit item";
	}

	return managedFor ? `Add to ${managedFor.name}'s wishlist` : "Add to your wishlist";
}

export default function WishlistItemFormModal({
	opened,
	item,
	suggestionFor,
	managedFor,
	onClose,
}: IWishlistItemFormModalProps) {
	const saveOwnItem = useSaveWishlistItemMutation(managedFor?.id ?? null);
	const saveSuggestion = useSaveSuggestionMutation(suggestionFor?.id ?? 0);
	const saveItem = suggestionFor ? saveSuggestion : saveOwnItem;
	const form = useForm<IFormValues>({ initialValues: initialValues(item) });
	const linkPreview = useLinkPreviewMutation();
	const linkLooksValid = /^https?:\/\/\S+\.\S+/i.test(form.values.url.trim());

	/** Fill in whatever the link's page tells us, but only into fields that are still empty. */
	function lookUpLink() {
		linkPreview.mutate(form.values.url.trim(), {
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
					quantity: Number(values.quantity) || 1,
					notes: values.notes.trim() || null,
					rating: values.rating,
				},
			},
			{ onSuccess: onClose },
		);
	}

	return (
		<Modal opened={opened} onClose={onClose} title={modalTitle(item, suggestionFor, managedFor)} centered>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{suggestionFor && (
						<MantineText size="sm" c="dimmed">
							{suggestionFor.name} won&apos;t see this. Anyone shopping for them can see, claim or edit it.
						</MantineText>
					)}
					{saveItem.isError && <Alert color="red">{apiErrorMessage(saveItem.error)}</Alert>}
					<Group gap="xs" align="flex-end" wrap="nowrap">
						<TextInput
							label="Link"
							description="Paste a product link, then fetch to fill in any empty fields we can."
							placeholder="https://"
							type="url"
							className={classes.linkField}
							data-autofocus={item ? undefined : true}
							{...form.getInputProps("url")}
						/>
						<Button variant="secondary" onClick={lookUpLink} disabled={!linkLooksValid} loading={linkPreview.isPending}>
							Fetch
						</Button>
					</Group>
					{linkPreview.isError && (
						<MantineText size="xs" c="red">
							{apiErrorMessage(linkPreview.error)}
						</MantineText>
					)}
					{linkPreview.isSuccess && Object.values(linkPreview.data).every((value) => value === null) && (
						<MantineText size="xs" c="dimmed">
							We couldn't find any details on that page. You can fill them in yourself.
						</MantineText>
					)}
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
									: "No image yet. Fetch a link above and we'll grab the shop's picture if it has one."}
							</MantineText>
						)}
					</Group>
					<Group grow align="flex-start">
						<NumberInput
							label="Price"
							prefix="$"
							min={0}
							decimalScale={2}
							fixedDecimalScale
							thousandSeparator=","
							{...form.getInputProps("price")}
						/>
						<NumberInput
							label="How many?"
							min={1}
							max={99}
							allowDecimal={false}
							clampBehavior="strict"
							{...form.getInputProps("quantity")}
						/>
					</Group>
					<Textarea
						label="Notes"
						placeholder={
							suggestionFor ? "Why it's a good idea, size, where to find it" : "Size, color, model, anything that helps"
						}
						autosize
						minRows={2}
						{...form.getInputProps("notes")}
					/>
					{/* Only the person themselves can say how much they want something. */}
					{!suggestionFor && (
						<Input.Wrapper label="How much do you want it?">
							<Rating
								size="lg"
								getSymbolLabel={(stars) => `${stars} star${stars === 1 ? "" : "s"}`}
								{...form.getInputProps("rating")}
							/>
						</Input.Wrapper>
					)}
					<Group justify="flex-end">
						<Button variant="subtle" color="gray" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							loading={saveItem.isPending}
							leftSection={item ? undefined : <FontAwesomeIcon icon={faPlus} />}
						>
							{item ? "Save" : suggestionFor ? "Add idea" : "Add item"}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
