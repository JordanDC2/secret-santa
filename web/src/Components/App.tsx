import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "Components/Contexts/Auth";
import LoginPage from "Components/Auth/LoginPage";
import RegisterPage from "Components/Auth/RegisterPage";
import DashboardPage from "Components/Dashboard/DashboardPage";
import AuthenticatedLayout from "Components/Layout/AuthenticatedLayout";
import { theme } from "Data/Theme";

const queryClient = new QueryClient();

function AppRoutes() {
	const { status } = useAuth();

	if (status === "loading") {
		return null;
	}

	return (
		<Routes>
			<Route path="/login" element={ status === "authenticated" ? <Navigate to="/" /> : <LoginPage /> } />
			<Route
				path="/register"
				element={ status === "authenticated" ? <Navigate to="/" /> : <RegisterPage /> }
			/>
			<Route element={ <AuthenticatedLayout /> }>
				<Route path="/" element={ <DashboardPage /> } />
			</Route>
		</Routes>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={ queryClient }>
			<MantineProvider theme={ theme }>
				<AuthProvider>
					<BrowserRouter>
						<AppRoutes />
					</BrowserRouter>
				</AuthProvider>
			</MantineProvider>
			<ReactQueryDevtools initialIsOpen={ false } />
		</QueryClientProvider>
	);
}
