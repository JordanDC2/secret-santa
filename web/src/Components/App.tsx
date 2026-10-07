import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SettingsPage from "Components/Settings/SettingsPage";
import AdminPage from "Components/Admin/AdminPage";
import PrivacyPage from "Components/Legal/PrivacyPage";
import TermsPage from "Components/Legal/TermsPage";
import PublicLayout from "Components/Layout/PublicLayout";
import UpdateNotice from "Components/AppUpdates/UpdateNotice";
import { liveUpdatesEnabled } from "Data/Api/LiveUpdates";
import { AuthProvider, useAuth } from "Components/Auth/AuthContext";
import EmailVerifiedPage from "Components/Auth/EmailVerifiedPage";
import ForgotPasswordPage from "Components/Auth/ForgotPasswordPage";
import LoginPage from "Components/Auth/LoginPage";
import RegisterPage from "Components/Auth/RegisterPage";
import ResetPasswordPage from "Components/Auth/ResetPasswordPage";
import DashboardPage from "Components/Dashboard/DashboardPage";
import JoinInvitePage from "Components/Invites/JoinInvitePage";
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
			<Route path="/email-verified" element={<EmailVerifiedPage />} />
			{/* Signed in or not: an invite link explains itself, then joins once they're in. */}
			<Route path="/join/:code" element={<JoinInvitePage />} />
			{/* Signed in or not. */}
			<Route element={<PublicLayout />}>
				<Route path="/privacy" element={<PrivacyPage />} />
				<Route path="/terms" element={<TermsPage />} />
			</Route>
			<Route element={<AuthenticatedLayout />}>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/wishlist" element={<MyWishlistPage />} />
				<Route path="/settings" element={<SettingsPage />} />
				<Route path="/admin" element={<AdminPage />} />
				{/* The page was called Account before; older emails still link here. */}
				<Route path="/account" element={<Navigate to="/settings" replace />} />
				<Route path="/wishlists/:userId" element={<MemberWishlistPage />} />
			</Route>
		</Routes>
	);
}

/** Each device remembers its own choice; "auto" follows the phone or computer's setting. */
const colorSchemeManager = localStorageColorSchemeManager({ key: "secret-santa-color-scheme" });

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider
				theme={theme}
				cssVariablesResolver={cssVariablesResolver}
				defaultColorScheme="auto"
				colorSchemeManager={colorSchemeManager}
			>
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
