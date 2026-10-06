import { Alert, Stack, Text as MantineText } from "@mantine/core";
import LoadingText from "Components/Common/LoadingText";
import { useGroupsQuery } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import GroupCard from "Components/Groups/GroupCard";

export default function GroupList() {
	const groupsQuery = useGroupsQuery();

	if (groupsQuery.isPending) {
		return <LoadingText>Loading your groups...</LoadingText>;
	}

	if (groupsQuery.isError) {
		return <Alert color="red">{apiErrorMessage(groupsQuery.error)}</Alert>;
	}

	if (groupsQuery.data.length === 0) {
		return (
			<MantineText c="dimmed">
				You haven&apos;t joined or created any groups yet. Start one, or join with a code from a friend.
			</MantineText>
		);
	}

	return (
		<Stack>
			{groupsQuery.data.map((group) => (
				<GroupCard key={group.id} group={group} />
			))}
		</Stack>
	);
}
