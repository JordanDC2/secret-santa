import { Button, Container, Group, Text as MantineText } from "@mantine/core";
import { useAuth } from "Components/Contexts/Auth";

export default function AppHeader() {
	const { user, logout } = useAuth();

	return (
		<Container size="lg" py="sm">
			<Group justify="space-between">
				<MantineText fw={ 700 }>Secret Santa</MantineText>
				<Group>
					{ user && <MantineText size="sm" c="dimmed">{ user.email }</MantineText> }
					<Button variant="subtle" onClick={ () => logout() }>Log out</Button>
				</Group>
			</Group>
		</Container>
	);
}
