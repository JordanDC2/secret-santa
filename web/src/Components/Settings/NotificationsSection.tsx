import { Alert, Group, Stack, Switch, Text as MantineText } from "@mantine/core";
import LoadingText from "Components/Common/LoadingText";
import SectionCard from "Components/Common/SectionCard";
import PushDeviceControl from "Components/PushNotifications/PushDeviceControl";
import { usePreferencesQuery, useUpdatePreferenceMutation } from "Components/Settings/hooks";
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
		description:
			"When your Santa or your person sends you a message. Pushed for each one; emailed only if you haven't read it within 5 minutes.",
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

/**
 * Turning push on for this device, then one row per kind of notification with an Email and a
 * Push switch, each saved as soon as it's flipped. Password and account emails aren't here:
 * those always go, by email only.
 */
export default function NotificationsSection() {
	const email = usePreferencesQuery("email");
	const push = usePreferencesQuery("push");
	const updateEmail = useUpdatePreferenceMutation("email");
	const updatePush = useUpdatePreferenceMutation("push");
	const failed = email.error ?? push.error ?? updateEmail.error ?? updatePush.error;

	return (
		<SectionCard title="Notifications">
			<PushDeviceControl />
			{(email.isPending || push.isPending) && <LoadingText>Loading your notification settings...</LoadingText>}
			{failed && <Alert color="red">{apiErrorMessage(failed)}</Alert>}

			{email.data && push.data && (
				<Stack gap="lg">
					{SWITCHES.map(({ kind, label, description }) => (
						<div key={kind}>
							<MantineText fw={600} size="sm">
								{label}
							</MantineText>
							<MantineText size="xs" c="dimmed" mb={6}>
								{description}
							</MantineText>
							<Group gap="xl">
								<Switch
									size="sm"
									label="Email"
									checked={email.data[kind]}
									onChange={(event) => updateEmail.mutate({ kind, on: event.currentTarget.checked })}
								/>
								<Switch
									size="sm"
									label="Push"
									checked={push.data[kind]}
									onChange={(event) => updatePush.mutate({ kind, on: event.currentTarget.checked })}
								/>
							</Group>
						</div>
					))}
				</Stack>
			)}
		</SectionCard>
	);
}
