import { Stack, Text as MantineText } from "@mantine/core";
import { useGroupsQuery } from "Data/Hooks/Groups";
import { apiErrorMessage } from "Data/Api/Client";
import GroupCard from "Components/Groups/GroupCard";

export default function GroupList() {
	const groupsQuery = useGroupsQuery();

	if (groupsQuery.isPending) {
		return <MantineText c="dimmed">Loading your groups...</MantineText>;
	}

	if (groupsQuery.isError) {
		return <MantineText c="red">{apiErrorMessage(groupsQuery.error)}</MantineText>;
	}

	if (groupsQuery.data.length === 0) {
		return <MantineText c="dimmed">You haven&apos;t joined or created any groups yet.</MantineText>;
	}

	return (
		<Stack>
			{groupsQuery.data.map((group) => (
				<GroupCard key={group.id} group={group} />
			))}
		</Stack>
	);
}
