import { Alert, Modal, Stack, Switch, Text as MantineText } from "@mantine/core";
import { useSetProfileInGroupMutation } from "Components/Groups/hooks";
import type { IGroup } from "Components/Groups/types";
import { useManagedProfilesQuery } from "Components/ManagedProfiles/hooks";
import { apiErrorMessage } from "Data/Api/Client";

type IGroupKidsModalProps = {
	group: IGroup;
	opened: boolean;
	onClose: () => void;
};

/**
 * Which of the kids and pets you look after are in this group: one switch each, saved as it's
 * flipped. In the group they're drawn like anyone else, and you shop for whoever they get.
 */
export default function GroupKidsModal({ group, opened, onClose }: IGroupKidsModalProps) {
	const profiles = useManagedProfilesQuery().data ?? [];
	const setInGroup = useSetProfileInGroupMutation(group.id);
	const memberIds = new Set(group.members.map((member) => member.id));

	return (
		<Modal opened={opened} onClose={onClose} title={`Kids & pets in ${group.name}`} centered>
			<Stack>
				<MantineText size="sm" c="dimmed">
					They&apos;ll be in the draw like everyone else: someone shops for them, and you shop for whoever they get.
				</MantineText>
				{setInGroup.isError && <Alert color="red">{apiErrorMessage(setInGroup.error)}</Alert>}
				{profiles.map((profile) => (
					<Switch
						key={profile.id}
						label={profile.name}
						description={profile.kind === "pet" ? "Pet" : "Kid"}
						checked={memberIds.has(profile.id)}
						disabled={setInGroup.isPending && setInGroup.variables?.profileId === profile.id}
						onChange={(event) => setInGroup.mutate({ profileId: profile.id, inGroup: event.currentTarget.checked })}
					/>
				))}
			</Stack>
		</Modal>
	);
}
