import type { PropsWithChildren } from "react";
import { Paper } from "@mantine/core";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import Snowfall from "Components/Layout/Snowfall";
import classes from "Components/Layout/AuthLayout.module.less";

type IAuthLayoutProps = PropsWithChildren<{
	subtitle: string;
}>;

export default function AuthLayout({ subtitle, children }: IAuthLayoutProps) {
	return (
		<div className={classes.wrapper}>
			<Snowfall />
			<div className={classes.content}>
				<h1 className={classes.title}>
					<SantaHatIcon size="1.1em" />
					Secret Santa
				</h1>
				<p className={classes.subtitle}>{subtitle}</p>
				<Paper shadow="xl" p={30} radius="lg" className={classes.card}>
					{children}
				</Paper>
			</div>
		</div>
	);
}
