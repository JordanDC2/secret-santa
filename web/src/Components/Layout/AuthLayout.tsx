import type { PropsWithChildren } from "react";
import { Paper } from "@mantine/core";
import Snowfall from "Components/Layout/Snowfall";
import classes from "Components/Layout/AuthLayout.module.less";

type IAuthLayoutProps = PropsWithChildren<{
	subtitle: string;
}>;

/** Joins the last two words with a non-breaking space so a trailing emoji never wraps alone. */
function keepEndTogether(text: string) {
	return text.replace(/ (\S+)$/, "\u00a0$1");
}

export default function AuthLayout({ subtitle, children }: IAuthLayoutProps) {
	return (
		<div className={classes.wrapper}>
			<Snowfall />
			<div className={classes.content}>
				<h1 className={classes.title}>🎅 Secret Santa</h1>
				<p className={classes.subtitle}>{keepEndTogether(subtitle)}</p>
				<Paper shadow="xl" p={30} radius="lg" className={classes.card}>
					{children}
				</Paper>
			</div>
		</div>
	);
}
