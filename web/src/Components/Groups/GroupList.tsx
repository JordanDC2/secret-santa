import { Badge, Card, Group, Stack, Text as MantineText, Title } from "@mantine/core";
import { useGroupsQuery } from "Data/Hooks/Groups";
import { apiErrorMessage } from "Data/Api/Client";

export default function GroupList() {
	const groupsQuery = useGroupsQuery();

	if (groupsQuery.isPending) {
		return <MantineText c="dimmed">Loading your groups...</MantineText>;
	}

	if (groupsQuery.isError) {
		return <MantineText c="red">{ apiErrorMessage(groupsQuery.error) }</MantineText>;
	}

	if (groupsQuery.data.length === 0) {
		return <MantineText c="dimmed">You haven&apos;t joined or created any groups yet.</MantineText>;
	}

	return (
		<Stack>
			{ groupsQuery.data.map((group) => (
				<Card key={ group.id } withBorder padding="md" radius="md">
					<Group justify="space-between">
						<Title order={ 4 }>{ group.name }</Title>
						{ group.isOwner && <Badge color="blue">Owner</Badge> }
					</Group>
					<MantineText size="sm" c="dimmed">
						{ group.membersCount } member{ group.membersCount === 1 ? "" : "s" }
					</MantineText>
					<MantineText size="sm" mt="xs">
						Invite code: <MantineText span fw={ 700 }>{ group.joinCode }</MantineText>
					</MantineText>
				</Card>
			)) }
		</Stack>
	);
}
