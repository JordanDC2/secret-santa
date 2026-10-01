import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "Components/Contexts/Auth";
import AppHeader from "Components/Layout/AppHeader";
import classes from "Components/Layout/AuthenticatedLayout.module.less";

export default function AuthenticatedLayout() {
	const { status } = useAuth();

	if (status !== "authenticated") {
		return <Navigate to="/login" />;
	}

	return (
		<div className={classes.page}>
			<AppHeader />
			<Outlet />
		</div>
	);
}
