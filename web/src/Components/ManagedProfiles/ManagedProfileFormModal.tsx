import { useState } from "react";
import { Alert, Button, Group, Modal, SegmentedControl, Stack, TextInput } from "@mantine/core";
import { useSaveManagedProfileMutation } from "Components/ManagedProfiles/hooks";
import type { IManagedKind, IManagedProfile } from "Components/ManagedProfiles/types";
import { apiErrorMessage } from "Data/Api/Client";

type IManagedProfileFormModalProps = {
	opened: boolean;
	/** The profile being renamed, or null to add one. Mounted fresh each time it opens. */
	profile: IManagedProfile | null;
	onClose: () => void;
};

export default function ManagedProfileFormModal({ opened, profile, onClose }: IManagedProfileFormModalProps) {
	const save = useSaveManagedProfileMutation();
	const [name, setName] = useState(profile?.name ?? "");
	const [kind, setKind] = useState<IManagedKind>(profile?.kind ?? "child");

	return (
		<Modal opened={opened} onClose={onClose} title={profile ? `Edit ${profile.name}` : "Add a kid or pet"} centered>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					save.mutate({ id: profile?.id, name: name.trim(), kind }, { onSuccess: onClose });
				}}
			>
				<Stack>
					{save.isError && <Alert color="red">{apiErrorMessage(save.error)}</Alert>}
					<SegmentedControl
						value={kind}
						onChange={(value) => setKind(value as IManagedKind)}
						data={[
							{ value: "child", label: "Kid" },
							{ value: "pet", label: "Pet" },
						]}
					/>
					<TextInput
						label="Name"
						placeholder={kind === "pet" ? "e.g. Biscuit" : "e.g. Lily"}
						required
						maxLength={255}
						data-autofocus
						value={name}
						onChange={(event) => setName(event.currentTarget.value)}
					/>
					<Group justify="flex-end">
						<Button variant="subtle" color="gray" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" loading={save.isPending} disabled={!name.trim()}>
							{profile ? "Save" : "Add"}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
