import { useEffect } from "react";
import { Container, Divider, Stack, Title } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "Data/Redux/Store";
import { fetchGroups } from "Data/Redux/GroupsSlice";
import CreateGroupForm from "Components/Groups/CreateGroupForm";
import JoinGroupForm from "Components/Groups/JoinGroupForm";
import GroupList from "Components/Groups/GroupList";

export default function DashboardPage() {
	const dispatch = useDispatch<AppDispatch>();
	const user = useSelector((state: RootState) => state.auth.user);

	useEffect(() => {
		dispatch(fetchGroups());
	}, [ dispatch ]);

	return (
		<Container my={ 40 }>
			<Stack gap="xl">
				<Title>Welcome{ user ? `, ${ user.name }` : "" }</Title>

				<Stack>
					<Title order={ 3 }>Your groups</Title>
					<GroupList />
				</Stack>

				<Divider />

				<Stack>
					<Title order={ 3 }>Create a group</Title>
					<CreateGroupForm />
				</Stack>

				<Divider />

				<Stack>
					<Title order={ 3 }>Join a group</Title>
					<JoinGroupForm />
				</Stack>
			</Stack>
		</Container>
	);
}
