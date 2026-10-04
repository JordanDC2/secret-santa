import { useState } from "react";
import { Alert, Button, Card, Group, List, PasswordInput, Stack, Text as MantineText, Title } from "@mantine/core";
import { useDeleteAccountMutation } from "Components/Account/hooks";
import { useGroupsQuery } from "Components/Groups/hooks";
import { apiFieldErrors } from "Data/Api/Client";
import classes from "Components/Account/DeleteAccountSection.module.less";

export default function DeleteAccountSection() {
	const deleteAccount = useDeleteAccountMutation();
	const groupsQuery = useGroupsQuery();
	const [confirming, setConfirming] = useState(false);
	const [password, setPassword] = useState("");

	const ownedGroups = groupsQuery.data?.filter((group) => group.isOwner) ?? [];
	const drawnMemberGroups = groupsQuery.data?.filter((group) => !group.isOwner && group.isDrawn) ?? [];
	const passwordError = apiFieldErrors(deleteAccount.error).current_password;

	function cancel() {
		setConfirming(false);
		setPassword("");
		deleteAccount.reset();
	}

	return (
		<Card withBorder padding="lg" radius="md" className={classes.danger}>
			<Title order={4} mb="xs" c="red.8">
				Delete account
			</Title>
			<Stack gap="sm">
				<MantineText size="sm">
					This permanently deletes your account and your wishlist. Gifts you claimed on other lists become available
					again. This can&apos;t be undone.
				</MantineText>

				{ownedGroups.length > 0 && (
					<Alert color="red" title="These groups you own will be deleted for everyone">
						<List size="sm">
							{ownedGroups.map((group) => (
								<List.Item key={group.id}>{group.name}</List.Item>
							))}
						</List>
					</Alert>
				)}

				{drawnMemberGroups.length > 0 && (
					<Alert color="orange" title="Names have already been drawn in">
						<List size="sm">
							{drawnMemberGroups.map((group) => (
								<List.Item key={group.id}>{group.name}</List.Item>
							))}
						</List>
						<MantineText size="sm" mt="xs">
							Leaving now means your Secret Santa has nobody to buy for, and your person loses their Santa.
						</MantineText>
					</Alert>
				)}

				{confirming ? (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							deleteAccount.mutate(password);
						}}
					>
						<Stack gap="sm">
							<PasswordInput
								label="Enter your password to confirm"
								value={password}
								onChange={(event) => setPassword(event.currentTarget.value)}
								error={passwordError}
								required
								autoFocus
							/>
							<Group gap="sm">
								<Button type="submit" color="red" loading={deleteAccount.isPending}>
									Delete my account forever
								</Button>
								<Button variant="subtle" color="gray" onClick={cancel}>
									Cancel
								</Button>
							</Group>
						</Stack>
					</form>
				) : (
					<Group>
						<Button color="red" variant="subtle" onClick={() => setConfirming(true)}>
							Delete my account
						</Button>
					</Group>
				)}
			</Stack>
		</Card>
	);
}
