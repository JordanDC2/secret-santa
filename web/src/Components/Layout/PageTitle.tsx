import type { ReactNode } from "react";
import classes from "Components/Layout/PageTitle.module.less";

type IPageTitleProps = {
	/** A festive illustration shown before the title, sized to the title text. */
	icon?: ReactNode;
	children: ReactNode;
};

/** The festive page heading used at the top of every signed-in page. */
export default function PageTitle({ icon, children }: IPageTitleProps) {
	return (
		<h1 className={classes.title}>
			{icon}
			<span>{children}</span>
		</h1>
	);
}
