import { useState } from "react";
import { Alert, Card, Container, SimpleGrid, Stack, Title } from "@mantine/core";
import { useLocation } from "react-router-dom";
import InstallAppTip from "Components/AppInstall/InstallAppTip";
import type { IInviteNotice } from "Components/Invites/types";
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
	const location = useLocation();
	// "You joined …" after following an invite link, until dismissed.
	const [inviteNotice, setInviteNotice] = useState(
		() => (location.state as IInviteNotice | null)?.inviteNotice ?? null,
	);

	return (
		<Container my={40}>
			<Stack gap="xl">
				<PageTitle icon={<ChristmasTreeIcon />}>Welcome{user ? `, ${user.firstName}` : ""}!</PageTitle>
				{inviteNotice && (
					<Alert color="green" withCloseButton closeButtonLabel="Dismiss" onClose={() => setInviteNotice(null)}>
						{inviteNotice}
					</Alert>
				)}
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
