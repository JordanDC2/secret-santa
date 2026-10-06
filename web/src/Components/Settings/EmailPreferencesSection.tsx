import { Alert, Stack, Switch } from "@mantine/core";
import LoadingText from "Components/Common/LoadingText";
import SectionCard from "Components/Common/SectionCard";
import { useEmailPreferencesQuery, useUpdateEmailPreferenceMutation } from "Components/Settings/hooks";
import type { IEmailKind } from "Components/Settings/types";
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
		kind: "exchange_updates",
		label: "Exchange date and budget changes",
		description: "When a group's owner sets, moves or removes its exchange date or budget.",
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
		<SectionCard title="Email notifications">
			{preferencesQuery.isPending && <LoadingText>Loading your email settings...</LoadingText>}
			{preferencesQuery.isError && <Alert color="red">{apiErrorMessage(preferencesQuery.error)}</Alert>}
			{updatePreference.isError && <Alert color="red">{apiErrorMessage(updatePreference.error)}</Alert>}

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
		</SectionCard>
	);
}
