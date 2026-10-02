import { Card, Container, SimpleGrid, Stack, Title } from "@mantine/core";
import { useAuth } from "Components/Auth/AuthContext";
import CreateGroupForm from "Components/Groups/CreateGroupForm";
import JoinGroupForm from "Components/Groups/JoinGroupForm";
import GroupList from "Components/Groups/GroupList";
import CandyCaneDivider from "Components/Layout/CandyCaneDivider";
import classes from "Components/Dashboard/DashboardPage.module.less";

export default function DashboardPage() {
	const { user } = useAuth();

	return (
		<Container my={40}>
			<Stack gap="xl">
				<h1 className={classes.welcome}>🎄 Welcome{user ? `, ${user.name}` : ""}!</h1>

				<Stack>
					<Title order={3}>🎁 Your groups</Title>
					<GroupList />
				</Stack>

				<CandyCaneDivider />

				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<Card withBorder padding="lg" radius="md">
						<Title order={4} mb="sm">
							✨ Create a group
						</Title>
						<CreateGroupForm />
					</Card>
					<Card withBorder padding="lg" radius="md">
						<Title order={4} mb="sm">
							🔑 Join a group
						</Title>
						<JoinGroupForm />
					</Card>
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
