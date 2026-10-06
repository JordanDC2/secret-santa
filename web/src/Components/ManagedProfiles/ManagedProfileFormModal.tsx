import { useState } from "react";
import { Alert, Divider, Modal, SegmentedControl, SimpleGrid, Stack, TextInput } from "@mantine/core";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import CoParentsSection from "Components/ManagedProfiles/CoParentsSection";
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
	const [firstName, setFirstName] = useState(profile?.firstName ?? "");
	const [lastName, setLastName] = useState(profile?.lastName ?? "");
	const [kind, setKind] = useState<IManagedKind>(profile?.kind ?? "child");

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={profile ? `Edit ${profile.firstName}` : "Add a kid or pet"}
			centered
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					save.mutate(
						{ id: profile?.id, firstName: firstName.trim(), lastName: lastName.trim(), kind },
						{ onSuccess: onClose },
					);
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
					<SimpleGrid cols={2}>
						<TextInput
							label="First name"
							placeholder={kind === "pet" ? "e.g. Biscuit" : "e.g. Lily"}
							required
							maxLength={255}
							data-autofocus
							value={firstName}
							onChange={(event) => setFirstName(event.currentTarget.value)}
						/>
						<TextInput
							label="Last name"
							placeholder="Optional"
							maxLength={255}
							value={lastName}
							onChange={(event) => setLastName(event.currentTarget.value)}
						/>
					</SimpleGrid>
					<ConfirmButtons
						confirmLabel={profile ? "Save" : kind === "pet" ? "Add pet" : "Add kid"}
						confirmIcon={profile ? undefined : <FontAwesomeIcon icon={faPlus} />}
						isPending={save.isPending}
						disabled={!firstName.trim()}
						onCancel={onClose}
					/>
				</Stack>
			</form>
			{profile && (
				<>
					<Divider my="lg" />
					<CoParentsSection profileId={profile.id} />
				</>
			)}
		</Modal>
	);
}
