import type { ReactNode } from "react";
import { Anchor, Stack, Text as MantineText, Title } from "@mantine/core";
import { useAuth } from "Components/Auth/AuthContext";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "Components/Legal/legal";

/** The Privacy or Terms page: a title, when it last changed, then its sections. */
export function LegalPage({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
	const { user } = useAuth();

	return (
		<Page size="sm">
			<Stack gap="lg">
				{user && <BackToGroups />}
				<PageTitle icon={icon}>{title}</PageTitle>
				<MantineText size="sm" c="dimmed">
					Last updated {LEGAL_UPDATED}
				</MantineText>
				{children}
			</Stack>
		</Page>
	);
}

/** One titled part of a legal page. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Stack gap="xs" component="section">
			<Title order={2} size="h4">
				{title}
			</Title>
			{children}
		</Stack>
	);
}

/** The contact address as a mail link. */
export function ContactLink() {
	return <Anchor href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Anchor>;
}
