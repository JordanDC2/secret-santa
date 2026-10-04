import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MantineProvider } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AccountPage from "Components/Account/AccountPage";
import UpdateNotice from "Components/AppUpdates/UpdateNotice";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";
import { AuthProvider, useAuth } from "Components/Auth/AuthContext";
import ForgotPasswordPage from "Components/Auth/ForgotPasswordPage";
import LoginPage from "Components/Auth/LoginPage";
import RegisterPage from "Components/Auth/RegisterPage";
import ResetPasswordPage from "Components/Auth/ResetPasswordPage";
import DashboardPage from "Components/Dashboard/DashboardPage";
import AuthenticatedLayout from "Components/Layout/AuthenticatedLayout";
import MemberWishlistPage from "Components/Wishlist/MemberWishlistPage";
import MyWishlistPage from "Components/Wishlist/MyWishlistPage";
import { cssVariablesResolver, theme } from "Data/Theme";

const queryClient = new QueryClient();

/** The devtools' floating button covers page controls on phone-sized screens. */
function DevtoolsOnLargerScreens() {
	const isPhoneSized = useMediaQuery("(max-width: 48em)");

	return isPhoneSized ? null : <ReactQueryDevtools initialIsOpen={false} />;
}

function AppRoutes() {
	const { status } = useAuth();

	if (status === "loading") {
		return null;
	}

	return (
		<Routes>
			<Route path="/login" element={status === "authenticated" ? <Navigate to="/" /> : <LoginPage />} />
			<Route path="/register" element={status === "authenticated" ? <Navigate to="/" /> : <RegisterPage />} />
			<Route
				path="/forgot-password"
				element={status === "authenticated" ? <Navigate to="/" /> : <ForgotPasswordPage />}
			/>
			<Route path="/reset-password" element={<ResetPasswordPage />} />
			<Route element={<AuthenticatedLayout />}>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/wishlist" element={<MyWishlistPage />} />
				<Route path="/account" element={<AccountPage />} />
				<Route path="/wishlists/:userId" element={<MemberWishlistPage />} />
			</Route>
		</Routes>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
				<AuthProvider>
					<BrowserRouter>
						<AppRoutes />
						{liveUpdatesEnabled() && <UpdateNotice />}
					</BrowserRouter>
				</AuthProvider>
			</MantineProvider>
			<DevtoolsOnLargerScreens />
		</QueryClientProvider>
	);
}
