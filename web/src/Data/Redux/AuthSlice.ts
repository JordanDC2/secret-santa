import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "Data/Interfaces/IUser";
import { apiClient, ApiError } from "Data/Api/Client";

export type IAuthState = {
	user: IUser | null;
	status: "idle" | "loading" | "authenticated" | "unauthenticated";
	error: string | null;
};

const initialState: IAuthState = {
	user: null,
	status: "idle",
	error: null
};

function toErrorMessage(error: unknown): string {
	return error instanceof ApiError
		? error.message
		: "Something went wrong. Please try again.";
}

export const fetchCurrentUser = createAsyncThunk(
	"auth/fetchCurrentUser",
	() => apiClient.get<IUser>("/user")
);

export const login = createAsyncThunk(
	"auth/login",
	async (credentials: { email: string; password: string }, { rejectWithValue }) => {
		try {
			return await apiClient.post<IUser>("/auth/login", credentials);
		} catch (error) {
			return rejectWithValue(toErrorMessage(error));
		}
	}
);

export const logout = createAsyncThunk(
	"auth/logout",
	() => apiClient.post<void>("/auth/logout")
);

export const register = createAsyncThunk(
	"auth/register",
	async (
		details: { name: string; email: string; password: string; passwordConfirmation: string },
		{ rejectWithValue }
	) => {
		try {
			return await apiClient.post<IUser>("/auth/register", {
				name: details.name,
				email: details.email,
				password: details.password,
				password_confirmation: details.passwordConfirmation
			});
		} catch (error) {
			return rejectWithValue(toErrorMessage(error));
		}
	}
);

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCurrentUser.pending, (state) => {
				state.status = "loading";
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<IUser>) => {
				state.user = action.payload;
				state.status = "authenticated";
			})
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.user = null;
				state.status = "unauthenticated";
			})
			.addCase(login.pending, (state) => {
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action: PayloadAction<IUser>) => {
				state.user = action.payload;
				state.status = "authenticated";
			})
			.addCase(login.rejected, (state, action) => {
				state.error = action.payload as string;
			})
			.addCase(register.pending, (state) => {
				state.error = null;
			})
			.addCase(register.fulfilled, (state, action: PayloadAction<IUser>) => {
				state.user = action.payload;
				state.status = "authenticated";
			})
			.addCase(register.rejected, (state, action) => {
				state.error = action.payload as string;
			})
			.addCase(logout.fulfilled, (state) => {
				state.user = null;
				state.status = "unauthenticated";
			});
	}
});

export default authSlice.reducer;
