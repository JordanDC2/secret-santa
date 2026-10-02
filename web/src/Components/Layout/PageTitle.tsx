import type { ReactNode } from "react";
import classes from "Components/Layout/PageTitle.module.less";

/** The festive page heading used at the top of every signed-in page. */
export default function PageTitle({ children }: { children: ReactNode }) {
	return <h1 className={classes.title}>{children}</h1>;
}
