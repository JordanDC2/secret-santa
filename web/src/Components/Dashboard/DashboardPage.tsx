import { Card, Container, SimpleGrid, Stack, Title } from "@mantine/core";
import InstallAppTip from "Components/AppInstall/InstallAppTip";
import ChristmasTreeIcon from "Components/Common/FestiveIcons/ChristmasTreeIcon";
import HollyIcon from "Components/Common/FestiveIcons/HollyIcon";
import WreathIcon from "Components/Common/FestiveIcons/WreathIcon";
import { useAuth } from "Components/Auth/AuthContext";
import CreateGroupForm from "Components/Groups/CreateGroupForm";
import JoinGroupForm from "Components/Groups/JoinGroupForm";
import GroupList from "Components/Groups/GroupList";
import CandyCaneDivider from "Components/Layout/CandyCaneDivider";
import PageTitle from "Components/Layout/PageTitle";
import classes from "Components/Dashboard/DashboardPage.module.less";

export default function DashboardPage() {
	const { user } = useAuth();

	return (
		<Container my={40}>
			<Stack gap="xl">
				<PageTitle icon={<ChristmasTreeIcon />}>Welcome{user ? `, ${user.name}` : ""}!</PageTitle>
				<InstallAppTip />

				<Stack>
					<Title order={3}>Your groups</Title>
					<GroupList />
				</Stack>

				<CandyCaneDivider />

				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<Card withBorder padding="lg" radius="md">
						<Title order={4} mb="sm" className={classes.cardTitle}>
							<HollyIcon size="1.5em" />
							Create a group
						</Title>
						<CreateGroupForm />
					</Card>
					<Card withBorder padding="lg" radius="md">
						<Title order={4} mb="sm" className={classes.cardTitle}>
							<WreathIcon size="1.5em" />
							Join a group
						</Title>
						<JoinGroupForm />
					</Card>
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
