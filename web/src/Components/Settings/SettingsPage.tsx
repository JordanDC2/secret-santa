import { Stack } from "@mantine/core";
import Page from "Components/Layout/Page";
import SnowflakeIcon from "Components/Common/FestiveIcons/SnowflakeIcon";
import DeleteAccountSection from "Components/Settings/DeleteAccountSection";
import AdminSection from "Components/Settings/AdminSection";
import AppearanceSection from "Components/Settings/AppearanceSection";
import EmailPreferencesSection from "Components/Settings/EmailPreferencesSection";
import ManagedProfilesSection from "Components/ManagedProfiles/ManagedProfilesSection";
import PasswordSection from "Components/Settings/PasswordSection";
import ProfileSection from "Components/Settings/ProfileSection";
import { useAuth } from "Components/Auth/AuthContext";
import BackToGroups from "Components/Layout/BackToGroups";
import PageTitle from "Components/Layout/PageTitle";

export default function SettingsPage() {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<Page size="sm">
			<Stack gap="lg">
				<BackToGroups />
				<PageTitle icon={<SnowflakeIcon />}>Settings</PageTitle>
				{/* First, since only the site's owner ever sees it and it's what they come here for. */}
				{user.isAdmin && <AdminSection />}
				<ProfileSection user={user} />
				<ManagedProfilesSection />
				<PasswordSection />
				<EmailPreferencesSection />
				<AppearanceSection />
				<DeleteAccountSection />
			</Stack>
		</Page>
	);
}
