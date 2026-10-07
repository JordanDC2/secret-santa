import { Alert, Stack, Tabs } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import HollyIcon from "Components/Common/FestiveIcons/HollyIcon";
import SectionCard from "Components/Common/SectionCard";
import LoadingText from "Components/Common/LoadingText";
import AccountsSection from "Components/Admin/AccountsSection";
import GroupsSection from "Components/Admin/GroupsSection";
import SignUpsChart from "Components/Admin/SignUpsChart";
import StatTiles from "Components/Admin/StatTiles";
import SystemHealthSection from "Components/Admin/SystemHealthSection";
import { useAdminOverviewQuery } from "Components/Admin/hooks";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import { apiErrorMessage } from "Data/Api/Client";

function OverviewTab() {
	const overview = useAdminOverviewQuery();

	if (overview.isPending) {
		return <LoadingText>Loading the overview...</LoadingText>;
	}

	if (overview.isError) {
		return <Alert color="red">{apiErrorMessage(overview.error)}</Alert>;
	}

	return (
		<Stack gap="lg">
			<StatTiles counts={overview.data.counts} />
			<SectionCard title="Sign-ups, last 30 days">
				<SignUpsChart days={overview.data.signUps} />
			</SectionCard>
			<SystemHealthSection health={overview.data.health} />
		</Stack>
	);
}

/**
 * The site owner's page (ADMIN_EMAIL): how the site is doing and everyone's accounts and
 * groups. It never shows who drew whom, claims, gift ideas or chat messages.
 */
export default function AdminPage() {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	if (!user.isAdmin) {
		return <Navigate to="/" replace />;
	}

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups />
				<PageTitle icon={<HollyIcon />}>Admin</PageTitle>
				<Tabs defaultValue="overview" keepMounted={false}>
					<Tabs.List mb="lg">
						<Tabs.Tab value="overview">Overview</Tabs.Tab>
						<Tabs.Tab value="accounts">Accounts</Tabs.Tab>
						<Tabs.Tab value="groups">Groups</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel value="overview">
						<OverviewTab />
					</Tabs.Panel>
					<Tabs.Panel value="accounts">
						<AccountsSection />
					</Tabs.Panel>
					<Tabs.Panel value="groups">
						<GroupsSection />
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Page>
	);
}
