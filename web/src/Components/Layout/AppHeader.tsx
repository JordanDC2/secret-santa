import { Button, Container, Group, Text as MantineText } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "Data/Redux/Store";
import { logout } from "Data/Redux/AuthSlice";

export default function AppHeader() {
	const dispatch = useDispatch<AppDispatch>();
	const user = useSelector((state: RootState) => state.auth.user);

	return (
		<Container size="lg" py="sm">
			<Group justify="space-between">
				<MantineText fw={ 700 }>Secret Santa</MantineText>
				<Group>
					{ user && <MantineText size="sm" c="dimmed">{ user.email }</MantineText> }
					<Button variant="subtle" onClick={ () => dispatch(logout()) }>Log out</Button>
				</Group>
			</Group>
		</Container>
	);
}
