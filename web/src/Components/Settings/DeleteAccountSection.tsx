import { useState } from "react";
import { Alert, Button, Group, List, PasswordInput, Stack, Text as MantineText } from "@mantine/core";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { useDeleteAccountMutation } from "Components/Settings/hooks";
import { useGroupsQuery } from "Components/Groups/hooks";
import { useManagedProfilesQuery } from "Components/ManagedProfiles/hooks";
import { apiFieldErrors } from "Data/Api/Client";
import SectionCard from "Components/Common/SectionCard";

export default function DeleteAccountSection() {
	const deleteAccount = useDeleteAccountMutation();
	const groupsQuery = useGroupsQuery();
	const profilesQuery = useManagedProfilesQuery();
	const [confirming, setConfirming] = useState(false);
	const [password, setPassword] = useState("");

	const ownedGroups = groupsQuery.data?.filter((group) => group.isOwner) ?? [];
	// Nobody would be left to look after these, so they're deleted with the account.
	const onlyYours = profilesQuery.data?.filter((profile) => profile.managers.length === 1) ?? [];
	const drawnMemberGroups = groupsQuery.data?.filter((group) => !group.isOwner && group.isDrawn) ?? [];
	const passwordError = apiFieldErrors(deleteAccount.error).current_password;

	function cancel() {
		setConfirming(false);
		setPassword("");
		deleteAccount.reset();
	}

	return (
		<SectionCard title="Delete account" danger>
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

				{onlyYours.length > 0 && (
					<Alert color="red" title="These kids and pets go too">
						<List size="sm">
							{onlyYours.map((profile) => (
								<List.Item key={profile.id}>{profile.name}</List.Item>
							))}
						</List>
						<MantineText size="sm" mt="xs">
							You&apos;re the only one looking after them, so their wishlists and group places are deleted with your
							account. To keep one, share it with someone else first.
						</MantineText>
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
							<ConfirmButtons
								confirmLabel="Delete my account forever"
								color="red"
								isPending={deleteAccount.isPending}
								onCancel={cancel}
							/>
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
		</SectionCard>
	);
}
