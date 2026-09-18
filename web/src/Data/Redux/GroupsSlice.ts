import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IGroup } from "Data/Interfaces/IGroup";
import { apiClient, ApiError } from "Data/Api/Client";

export type IGroupsState = {
	groups: IGroup[];
	status: "idle" | "loading" | "loaded";
};

const initialState: IGroupsState = {
	groups: [],
	status: "idle"
};

function toErrorMessage(error: unknown): string {
	return error instanceof ApiError
		? error.message
		: "Something went wrong. Please try again.";
}

function mapGroup(raw: Record<string, unknown>): IGroup {
	return {
		id: raw.id as number,
		name: raw.name as string,
		joinCode: raw.join_code as string,
		isOwner: raw.is_owner as boolean,
		membersCount: raw.members_count as number
	};
}

export const fetchGroups = createAsyncThunk(
	"groups/fetchGroups",
	async () => {
		const groups = await apiClient.get<Record<string, unknown>[]>("/groups");

		return groups.map(mapGroup);
	}
);

export const createGroup = createAsyncThunk(
	"groups/createGroup",
	async (details: { name: string }, { rejectWithValue }) => {
		try {
			const group = await apiClient.post<Record<string, unknown>>("/groups", details);

			return mapGroup(group);
		} catch (error) {
			return rejectWithValue(toErrorMessage(error));
		}
	}
);

export const joinGroup = createAsyncThunk(
	"groups/joinGroup",
	async (details: { joinCode: string }, { rejectWithValue }) => {
		try {
			const group = await apiClient.post<Record<string, unknown>>("/groups/join", {
				join_code: details.joinCode
			});

			return mapGroup(group);
		} catch (error) {
			return rejectWithValue(toErrorMessage(error));
		}
	}
);

const groupsSlice = createSlice({
	name: "groups",
	initialState,
	extraReducers: (builder) => {
		builder
			.addCase(fetchGroups.pending, (state) => {
				state.status = "loading";
			})
			.addCase(fetchGroups.fulfilled, (state, action: PayloadAction<IGroup[]>) => {
				state.groups = action.payload;
				state.status = "loaded";
			})
			.addCase(createGroup.fulfilled, (state, action: PayloadAction<IGroup>) => {
				state.groups.push(action.payload);
			})
			.addCase(joinGroup.fulfilled, (state, action: PayloadAction<IGroup>) => {
				state.groups.push(action.payload);
			});
	},
	reducers: {}
});

export default groupsSlice.reducer;
