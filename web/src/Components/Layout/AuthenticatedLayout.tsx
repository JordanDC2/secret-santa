import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "Components/Contexts/Auth";
import AppHeader from "Components/Layout/AppHeader";

export default function AuthenticatedLayout() {
	const { status } = useAuth();

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
