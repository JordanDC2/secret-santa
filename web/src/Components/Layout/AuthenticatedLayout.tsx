import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import GroupLiveUpdates from "Components/Groups/GroupLiveUpdates";
import SantaChatLiveUpdates from "Components/SantaChat/SantaChatLiveUpdates";
import AppHeader from "Components/Layout/AppHeader";
import VerifyEmailBanner from "Components/Auth/VerifyEmailBanner";
import SiteFooter from "Components/Layout/SiteFooter";
import PendingInviteRedirect from "Components/Invites/PendingInviteRedirect";
import classes from "Components/Layout/AuthenticatedLayout.module.less";

export default function AuthenticatedLayout() {
	const { status } = useAuth();

	if (status !== "authenticated") {
		return <Navigate to="/login" />;
	}

	return (
		<div className={classes.page}>
			<PendingInviteRedirect />
			<GroupLiveUpdates />
			<SantaChatLiveUpdates />
			<AppHeader />
			<VerifyEmailBanner />
			<Outlet />
			<div className={classes.footer}>
				<SiteFooter />
			</div>
		</div>
	);
}
