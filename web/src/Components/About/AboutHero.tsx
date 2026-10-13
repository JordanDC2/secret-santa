import { Button, Paper, SimpleGrid, Stack, Text as MantineText, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import SiteFooter from "Components/Layout/SiteFooter";
import Snowfall from "Components/Layout/Snowfall";
import authClasses from "Components/Layout/AuthLayout.module.less";
import { ABOUT_FEATURES, ABOUT_TAGLINE } from "Components/About/features";
import classes from "Components/About/AboutHero.module.less";

/** The About page for someone not logged in: full screen like the log in pages, then the way in. */
export default function AboutHero() {
	return (
		<div className={authClasses.wrapper}>
			<Snowfall />
			<div className={classes.content}>
				<h1 className={authClasses.title}>
					<SantaHatIcon size="1.1em" />
					Secret Santa
				</h1>
				<p className={authClasses.subtitle}>{ABOUT_TAGLINE}</p>
				<Paper shadow="xl" p={{ base: "lg", xs: 30 }} radius="lg">
					<Stack gap="xl">
						<SimpleGrid cols={{ base: 1, xs: 2 }} spacing="lg" verticalSpacing="lg">
							{ABOUT_FEATURES.map((feature) => (
								<div key={feature.title} className={classes.feature}>
									<span className={classes.featureIcon}>{feature.icon}</span>
									<div>
										<Title order={2} size="h4">
											{feature.title}
										</Title>
										<MantineText size="sm" mt={4}>
											{feature.text}
										</MantineText>
									</div>
								</div>
							))}
						</SimpleGrid>
						<div className={classes.actions}>
							<Button component={Link} to="/register" size="md">
								Create account
							</Button>
							<Button component={Link} to="/login" size="md" variant="secondary">
								Log in
							</Button>
						</div>
					</Stack>
				</Paper>
				<SiteFooter onDark />
			</div>
		</div>
	);
}
