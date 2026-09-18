import { configureStore } from "@reduxjs/toolkit";
import authReducer from "Data/Redux/AuthSlice";
import groupsReducer from "Data/Redux/GroupsSlice";

export const store = configureStore({
	reducer: {
		auth: authReducer,
		groups: groupsReducer
	}
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
