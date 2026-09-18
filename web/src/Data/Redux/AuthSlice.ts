import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "Data/Interfaces/IUser";
import { apiClient } from "Data/Api/Client";

export type IAuthState = {
	user: IUser | null;
	status: "idle" | "loading" | "authenticated" | "unauthenticated";
};

const initialState: IAuthState = {
	user: null,
	status: "idle"
};

export const fetchCurrentUser = createAsyncThunk(
	"auth/fetchCurrentUser",
	() => apiClient.get<IUser>("/user")
);

export const login = createAsyncThunk(
	"auth/login",
	(credentials: { email: string; password: string }) => apiClient.post<IUser>("/auth/login", credentials)
);

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		loggedOut(state) {
			state.user = null;
			state.status = "unauthenticated";
		}
	},
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
			.addCase(login.fulfilled, (state, action: PayloadAction<IUser>) => {
				state.user = action.payload;
				state.status = "authenticated";
			});
	}
});

export const { loggedOut } = authSlice.actions;
export default authSlice.reducer;
