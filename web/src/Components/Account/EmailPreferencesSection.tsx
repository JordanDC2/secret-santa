import { Alert, Card, Stack, Switch, Title } from "@mantine/core";
import { useEmailPreferencesQuery, useUpdateEmailPreferenceMutation } from "Components/Account/hooks";
import type { IEmailKind } from "Components/Account/types";
import { apiErrorMessage } from "Data/Api/Client";

const SWITCHES: { kind: IEmailKind; label: string; description: string }[] = [
	{
		kind: "assignments",
		label: "Secret Santa assignments",
		description: "Who you drew when names are drawn. You can always see it on the group card too.",
	},
	{
		kind: "santa_chat",
		label: "Santa chat messages",
		description: "When your Santa or your person sends you a message. Unread badges show either way.",
	},
	{
		kind: "reminders",
		label: "Exchange reminders",
		description: "If your wishlist is empty 3 weeks before an exchange, and a shopping reminder 2 weeks before.",
	},
	{
		kind: "nudges",
		label: "Nudges",
		description: "When another shopper asks if you're still getting something you claimed.",
	},
	{
		kind: "gift_ideas",
		label: "Gift idea changes",
		description: "When someone edits or removes a gift idea you suggested.",
	},
	{
		kind: "new_members",
		label: "New group members",
		description: "When someone joins a group you own.",
	},
];

/** One switch per kind of optional email, each saved as soon as it's flipped. */
export default function EmailPreferencesSection() {
	const preferencesQuery = useEmailPreferencesQuery();
	const updatePreference = useUpdateEmailPreferenceMutation();

	return (
		<Card withBorder padding="lg" radius="md">
			<Title order={4} mb="md">
				Email notifications
			</Title>

			{preferencesQuery.isError && <Alert color="red">{apiErrorMessage(preferencesQuery.error)}</Alert>}
			{updatePreference.isError && (
				<Alert color="red" mb="md">
					{apiErrorMessage(updatePreference.error)}
				</Alert>
			)}

			{preferencesQuery.data && (
				<Stack gap="md">
					{SWITCHES.map(({ kind, label, description }) => (
						<Switch
							key={kind}
							label={label}
							description={description}
							checked={preferencesQuery.data[kind]}
							onChange={(event) => updatePreference.mutate({ kind, on: event.currentTarget.checked })}
						/>
					))}
				</Stack>
			)}
		</Card>
	);
}
