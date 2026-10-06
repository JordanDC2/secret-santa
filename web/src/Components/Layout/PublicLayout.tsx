import { Outlet } from "react-router-dom";
import AppHeader from "Components/Layout/AppHeader";
import SiteFooter from "Components/Layout/SiteFooter";
import classes from "Components/Layout/AuthenticatedLayout.module.less";

/** Pages anyone can read, signed in or not (Privacy, Terms): the usual header and footer. */
export default function PublicLayout() {
	return (
		<div className={classes.page}>
			<AppHeader />
			<Outlet />
			<div className={classes.footer}>
				<SiteFooter />
			</div>
		</div>
	);
}
