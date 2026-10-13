import { SimpleGrid, Stack, Text as MantineText } from "@mantine/core";
import AboutHero from "Components/About/AboutHero";
import { ABOUT_FEATURES, ABOUT_TAGLINE } from "Components/About/features";
import { useAuth } from "Components/Auth/AuthContext";
import SantaHatIcon from "Components/Common/FestiveIcons/SantaHatIcon";
import SectionCard from "Components/Common/SectionCard";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";

/**
 * What the app is and does (/about, linked from the footer). It's the home page Google checks
 * when reviewing the "Continue with Google" branding, so it must stay public and name the app;
 * index.html has a plain-text copy for readers that don't run JavaScript.
 *
 * Logged in, it's an ordinary page under the app's header (App.tsx gives it PublicLayout);
 * logged out, it's full screen like the log in pages.
 */
export default function AboutPage() {
	const { user } = useAuth();

	if (!user) {
		return <AboutHero />;
	}

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups />
				<PageTitle icon={<SantaHatIcon />}>About Secret Santa</PageTitle>
				<MantineText>{ABOUT_TAGLINE}</MantineText>
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					{ABOUT_FEATURES.map((feature) => (
						<SectionCard key={feature.title} icon={feature.icon} title={feature.title}>
							<MantineText size="sm">{feature.text}</MantineText>
						</SectionCard>
					))}
				</SimpleGrid>
			</Stack>
		</Page>
	);
}
