import { Container, Stack } from "@mantine/core";
import StockingIcon from "Components/Common/FestiveIcons/StockingIcon";
import DeleteAccountSection from "Components/Account/DeleteAccountSection";
import PasswordSection from "Components/Account/PasswordSection";
import ProfileSection from "Components/Account/ProfileSection";
import { useAuth } from "Components/Auth/AuthContext";
import PageTitle from "Components/Layout/PageTitle";

export default function AccountPage() {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<Container size="sm" my={40}>
			<Stack gap="lg">
				<PageTitle icon={<StockingIcon />}>Your account</PageTitle>
				<ProfileSection user={user} />
				<PasswordSection />
				<DeleteAccountSection />
			</Stack>
		</Container>
	);
}
