import { Anchor, Burger, Button, Collapse, Container, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate } from "react-router-dom";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import { useAuth } from "Components/Auth/AuthContext";
import { navigationItems } from "Components/Layout/navigationItems";
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

/**
 * The app's header. Signed in, wide screens show the pages in a row; narrower ones get a
 * menu button that opens them as a list under the header, so nothing wraps under the logo.
 */
export default function AppHeader() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [menuOpened, menu] = useDisclosure(false);
	const items = navigationItems.filter((item) => !item.adminOnly || user?.isAdmin);

	const logOut = () => logout(() => navigate("/login"));

	return (
		<div className={classes.header}>
			<Container size="lg" py="sm">
				<Group justify="space-between" wrap="nowrap">
					<Anchor component={Link} to="/" className={classes.homeLink} onClick={menu.close}>
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
					{user && (
						<>
							<Group gap="xs" wrap="nowrap" visibleFrom="md" component="nav" aria-label="Pages">
								{items.map((item) => (
									<Anchor key={item.to} component={Link} to={item.to} className={classes.navLink}>
										<item.icon size="1.3em" />
										{item.label}
									</Anchor>
								))}
								<Button size="xs" className={classes.accountButton} vars={accountButtonVars} onClick={logOut}>
									Log out
								</Button>
							</Group>
							<Burger
								opened={menuOpened}
								onClick={menu.toggle}
								hiddenFrom="md"
								size="sm"
								color="var(--festive-gold)"
								aria-label={menuOpened ? "Close menu" : "Open menu"}
								aria-expanded={menuOpened}
								aria-controls="header-menu"
							/>
						</>
					)}
				</Group>
			</Container>
			{user && (
				<Collapse in={menuOpened} hiddenFrom="md" id="header-menu">
					<Container size="lg" pb="md">
						<Stack gap={4} component="nav" aria-label="Pages">
							{items.map((item) => (
								<Anchor key={item.to} component={Link} to={item.to} className={classes.menuLink} onClick={menu.close}>
									<item.icon size="1.3em" />
									{item.label}
								</Anchor>
							))}
							<Button
								size="sm"
								mt="xs"
								className={classes.accountButton}
								vars={accountButtonVars}
								onClick={logOut}
								fullWidth
							>
								Log out
							</Button>
						</Stack>
					</Container>
				</Collapse>
			)}
		</div>
	);
}
