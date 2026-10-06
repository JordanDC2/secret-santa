import { useState } from "react";
import { Alert, Button, Group, Modal, SimpleGrid, Stack, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
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
import { useGroupsQuery } from "Components/Groups/hooks";
import PageTitle from "Components/Layout/PageTitle";
import SectionCard from "Components/Common/SectionCard";

type IOpenForm = "create" | "join" | null;

export default function DashboardPage() {
	const { user } = useAuth();
	const location = useLocation();
	const groupsQuery = useGroupsQuery();
	// "You joined …" after following an invite link, until dismissed.
	const [inviteNotice, setInviteNotice] = useState(
		() => (location.state as IInviteNotice | null)?.inviteNotice ?? null,
	);
	const [openForm, setOpenForm] = useState<IOpenForm>(null);
	// Brand new: no groups yet, so creating or joining one is the whole page.
	const hasNoGroups = groupsQuery.isSuccess && groupsQuery.data.length === 0;

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
					{/* Create and join sit by the heading, so they're never a long scroll past every group. */}
					<Group justify="space-between" gap="sm">
						<Title order={2} size="h3">
							Your groups
						</Title>
						{groupsQuery.isSuccess && !hasNoGroups && (
							<Group gap="xs">
								<Button leftSection={<FontAwesomeIcon icon={faPlus} />} onClick={() => setOpenForm("create")}>
									Create group
								</Button>
								<Button
									variant="secondary"
									leftSection={<FontAwesomeIcon icon={faRightToBracket} />}
									onClick={() => setOpenForm("join")}
								>
									Join group
								</Button>
							</Group>
						)}
					</Group>
					<GroupList />
				</Stack>

				{hasNoGroups && (
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<SectionCard title="Create a group" icon={<HollyIcon size="1.5em" />}>
							<CreateGroupForm />
						</SectionCard>
						<SectionCard title="Join a group" icon={<WreathIcon size="1.5em" />}>
							<JoinGroupForm />
						</SectionCard>
					</SimpleGrid>
				)}
			</Stack>

			<Modal opened={openForm === "create"} onClose={() => setOpenForm(null)} title="Create a group" centered>
				<CreateGroupForm onDone={() => setOpenForm(null)} />
			</Modal>
			<Modal opened={openForm === "join"} onClose={() => setOpenForm(null)} title="Join a group" centered>
				<JoinGroupForm onDone={() => setOpenForm(null)} />
			</Modal>
		</Page>
	);
}
