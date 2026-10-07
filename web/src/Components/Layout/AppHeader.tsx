import { Anchor, Button, Container, Group } from "@mantine/core";
import { Link } from "react-router-dom";
import HollyIcon from "Components/Common/FestiveIcons/HollyIcon";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import SnowflakeIcon from "Components/Common/FestiveIcons/SnowflakeIcon";
import WishListIcon from "Components/Common/FestiveIcons/WishListIcon";
import { useAuth } from "Components/Auth/AuthContext";
import classes from "Components/Layout/AppHeader.module.less";

// Mantine sets a button's colours inline, so they're swapped through its vars, not CSS.
const accountButtonVars = () => ({
	root: {
		"--button-bg": "var(--festive-header-button)",
		"--button-hover": "var(--festive-header-button-hover)",
		"--button-color": "var(--festive-header-button-text)",
		"--button-bd": "1px solid var(--festive-header-button-border)",
	},
});

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
					{/* Signed out (e.g. reading the Privacy page): just a way in. */}
					{!user && (
						<Button component={Link} to="/login" size="xs" className={classes.accountButton} vars={accountButtonVars}>
							Log in
						</Button>
					)}
					{/* xs gap: the nav pills carry their own padding, and it keeps them on one row on phones. */}
					{user && (
						<Group gap="xs">
							<Anchor component={Link} to="/wishlist" className={classes.navLink}>
								<WishListIcon size="1.3em" />
								My wishlist
							</Anchor>
							{/* The site owner's page. Phones reach it from Settings, so the row still fits. */}
							{user.isAdmin && (
								<Anchor component={Link} to="/admin" className={`${classes.navLink} ${classes.wideOnly}`}>
									<HollyIcon size="1.3em" />
									Admin
								</Anchor>
							)}
							<Anchor component={Link} to="/settings" className={classes.navLink}>
								<SnowflakeIcon size="1.3em" />
								Settings
							</Anchor>
							<Button size="xs" className={classes.accountButton} vars={accountButtonVars} onClick={() => logout()}>
								Log out
							</Button>
						</Group>
					)}
				</Group>
			</Container>
		</div>
	);
}
