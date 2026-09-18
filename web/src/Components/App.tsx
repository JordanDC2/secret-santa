import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "Data/Redux/Store";
import { fetchCurrentUser } from "Data/Redux/AuthSlice";
import LoginPage from "Components/Auth/LoginPage";
import DashboardPage from "Components/Dashboard/DashboardPage";

export default function App() {
	const dispatch = useDispatch<AppDispatch>();
	const status = useSelector((state: RootState) => state.auth.status);

	useEffect(() => {
		dispatch(fetchCurrentUser());
	}, [ dispatch ]);

	if (status === "idle" || status === "loading") {
		return null;
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={ status === "authenticated" ? <Navigate to="/" /> : <LoginPage /> } />
				<Route path="/" element={ status === "authenticated" ? <DashboardPage /> : <Navigate to="/login" /> } />
			</Routes>
		</BrowserRouter>
	);
}
