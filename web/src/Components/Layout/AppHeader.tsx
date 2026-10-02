import { Anchor, Button, Container, Group, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import classes from "Components/Layout/AppHeader.module.less";

export default function AppHeader() {
	const { user, logout } = useAuth();

	return (
		<div className={classes.header}>
			<Container size="lg" py="sm">
				<Group justify="space-between">
					<Anchor component={Link} to="/" className={classes.homeLink}>
						<span className={classes.title}>🎅 Secret Santa</span>
					</Anchor>
					<Group>
						<Anchor component={Link} to="/wishlist" className={classes.navLink}>
							📝 My wishlist
						</Anchor>
						<Anchor component={Link} to="/account" className={classes.navLink}>
							⚙️ Account
						</Anchor>
						{user && (
							<MantineText size="sm" c="gray.4" visibleFrom="sm">
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
