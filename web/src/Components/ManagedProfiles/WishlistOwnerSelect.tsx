import { Group, Select, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChild, faPaw, faUser } from "@fortawesome/free-solid-svg-icons";
import type { IManagedProfile } from "Components/ManagedProfiles/types";

type IWishlistOwnerSelectProps = {
	profiles: IManagedProfile[];
	/** The kid or pet being shown, or null for your own list. */
	value: number | null;
	onChange: (profileId: number | null) => void;
};

const SELF = "self";

function iconFor(kind: IManagedProfile["kind"] | "self") {
	return kind === "pet" ? faPaw : kind === "child" ? faChild : faUser;
}

/**
 * Whose wishlist the page shows: yours, or a kid's or pet's you look after. A searchable
 * dropdown rather than tabs, so it copes with a big family as well as one kid.
 */
export default function WishlistOwnerSelect({ profiles, value, onChange }: IWishlistOwnerSelectProps) {
	const kindOf = (id: string) =>
		id === SELF ? "self" : (profiles.find((profile) => String(profile.id) === id)?.kind ?? "self");
	const selected = value === null ? SELF : String(value);

	return (
		<Select
			label="Showing"
			w={{ base: "100%", xs: 280 }}
			searchable
			allowDeselect={false}
			nothingFoundMessage="No one by that name"
			maxDropdownHeight={300}
			comboboxProps={{ withinPortal: true }}
			// Typing replaces the current name instead of adding to it.
			onFocus={(event) => event.currentTarget.select()}
			value={selected}
			onChange={(id) => onChange(id === null || id === SELF ? null : Number(id))}
			leftSection={<FontAwesomeIcon icon={iconFor(kindOf(selected))} />}
			data={[
				{ value: SELF, label: "Me" },
				...profiles.map((profile) => ({ value: String(profile.id), label: profile.name })),
			]}
			renderOption={({ option }) => (
				<Group gap="sm" wrap="nowrap">
					<FontAwesomeIcon icon={iconFor(kindOf(option.value))} fixedWidth />
					<MantineText size="sm">{option.label}</MantineText>
				</Group>
			)}
		/>
	);
}
