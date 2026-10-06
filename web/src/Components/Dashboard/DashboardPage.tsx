import { useState } from "react";
import { Alert, SimpleGrid, Stack, Title } from "@mantine/core";
import Page from "Components/Layout/Page";
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
import SectionCard from "Components/Common/SectionCard";

export default function DashboardPage() {
	const { user } = useAuth();
	const location = useLocation();
	// "You joined …" after following an invite link, until dismissed.
	const [inviteNotice, setInviteNotice] = useState(
		() => (location.state as IInviteNotice | null)?.inviteNotice ?? null,
	);

	return (
		<Page>
			<Stack gap="xl">
				<PageTitle icon={<ChristmasTreeIcon />}>Welcome{user ? `, ${user.firstName}` : ""}!</PageTitle>
				{inviteNotice && (
					<Alert color="green" withCloseButton closeButtonLabel="Dismiss" onClose={() => setInviteNotice(null)}>
						{inviteNotice}
					</Alert>
				)}
				<InstallAppTip />

				<Stack>
					<Title order={2} size="h3">
						Your groups
					</Title>
					<GroupList />
				</Stack>

				<CandyCaneDivider />

				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<SectionCard title="Create a group" icon={<HollyIcon size="1.5em" />}>
						<CreateGroupForm />
					</SectionCard>
					<SectionCard title="Join a group" icon={<WreathIcon size="1.5em" />}>
						<JoinGroupForm />
					</SectionCard>
				</SimpleGrid>
			</Stack>
		</Page>
	);
}
