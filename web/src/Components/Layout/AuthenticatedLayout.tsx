import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "Data/Redux/Store";
import AppHeader from "Components/Layout/AppHeader";

export default function AuthenticatedLayout() {
	const status = useSelector((state: RootState) => state.auth.status);

	if (status !== "authenticated") {
		return <Navigate to="/login" />;
	}

	return (
		<>
			<AppHeader />
			<Outlet />
		</>
	);
}
