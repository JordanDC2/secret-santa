import { Stack } from "@mantine/core";
import Page from "Components/Layout/Page";
import StockingIcon from "Components/Common/FestiveIcons/StockingIcon";
import DeleteAccountSection from "Components/Account/DeleteAccountSection";
import EmailPreferencesSection from "Components/Account/EmailPreferencesSection";
import ManagedProfilesSection from "Components/ManagedProfiles/ManagedProfilesSection";
import PasswordSection from "Components/Account/PasswordSection";
import ProfileSection from "Components/Account/ProfileSection";
import { useAuth } from "Components/Auth/AuthContext";
import BackToGroups from "Components/Layout/BackToGroups";
import PageTitle from "Components/Layout/PageTitle";

export default function AccountPage() {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<Page size="sm">
			<Stack gap="lg">
				<BackToGroups />
				<PageTitle icon={<StockingIcon />}>Your account</PageTitle>
				<ProfileSection user={user} />
				<ManagedProfilesSection />
				<PasswordSection />
				<EmailPreferencesSection />
				<DeleteAccountSection />
			</Stack>
		</Page>
	);
}
