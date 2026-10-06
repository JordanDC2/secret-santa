import { Anchor, Button, Container, Group } from "@mantine/core";
import { Link } from "react-router-dom";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import SnowflakeIcon from "Components/Common/FestiveIcons/SnowflakeIcon";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import { useAuth } from "Components/Auth/AuthContext";
import classes from "Components/Layout/AppHeader.module.less";

export default function AppHeader() {
	const { logout } = useAuth();

	return (
		<div className={classes.header}>
			<Container size="lg" py="sm">
				<Group justify="space-between">
					<Anchor component={Link} to="/" className={classes.homeLink}>
						<span className={classes.title}>
							<SantaHatIcon size="1.15em" />
							Secret Santa
						</span>
					</Anchor>
					{/* xs gap: the nav pills carry their own padding, and it keeps them on one row on phones. */}
					<Group gap="xs">
						<Anchor component={Link} to="/wishlist" className={classes.navLink}>
							<WishListIcon size="1.3em" />
							My wishlist
						</Anchor>
						<Anchor component={Link} to="/settings" className={classes.navLink}>
							<SnowflakeIcon size="1.3em" />
							Settings
						</Anchor>
						<Button variant="white" color="red" size="xs" onClick={() => logout()}>
							Log out
						</Button>
					</Group>
				</Group>
			</Container>
		</div>
	);
}
