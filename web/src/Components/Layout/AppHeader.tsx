import { Button, Container, Group, Text as MantineText } from "@mantine/core";
import { useAuth } from "Components/Auth/AuthContext";
import classes from "Components/Layout/AppHeader.module.less";

export default function AppHeader() {
	const { user, logout } = useAuth();

	return (
		<div className={classes.header}>
			<Container size="lg" py="sm">
				<Group justify="space-between">
					<span className={classes.title}>🎅 Secret Santa</span>
					<Group>
						{user && (
							<MantineText size="sm" c="gray.4">
								{user.email}
							</MantineText>
						)}
						<Button variant="white" color="red" size="xs" onClick={() => logout()}>
							Log out
						</Button>
					</Group>
				</Group>
			</Container>
		</div>
	);
}
