import { Anchor, Button, Container, Group, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import StockingIcon from "Components/Common/FestiveIcons/StockingIcon";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import { useAuth } from "Components/Auth/AuthContext";
import classes from "Components/Layout/AppHeader.module.less";

export default function AppHeader() {
	const { user, logout } = useAuth();

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
						<Anchor component={Link} to="/account" className={classes.navLink}>
							<StockingIcon size="1.3em" />
							Account
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
