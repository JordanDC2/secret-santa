import { useState } from "react";
import { Alert, Button, Group, List, PasswordInput, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { useAuth } from "Components/Auth/AuthContext";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { useDeleteAccountMutation } from "Components/Settings/hooks";
import { useGroupsQuery } from "Components/Groups/hooks";
import { useManagedProfilesQuery } from "Components/ManagedProfiles/hooks";
import { apiFieldErrors } from "Data/Api/Client";
import SectionCard from "Components/Common/SectionCard";

export default function DeleteAccountSection() {
	const { user } = useAuth();
	const deleteAccount = useDeleteAccountMutation();
	const groupsQuery = useGroupsQuery();
	const profilesQuery = useManagedProfilesQuery();
	const [confirming, setConfirming] = useState(false);
	// Their password, or their email for someone who only uses "Continue with Google".
	const [confirmation, setConfirmation] = useState("");
	const hasPassword = user?.hasPassword ?? true;

	const ownedGroups = groupsQuery.data?.filter((group) => group.isOwner) ?? [];
	// Nobody would be left to look after these, so they're deleted with the account.
	const onlyYours = profilesQuery.data?.filter((profile) => profile.managers.length === 1) ?? [];
	const drawnMemberGroups = groupsQuery.data?.filter((group) => !group.isOwner && group.isDrawn) ?? [];
	const fieldErrors = apiFieldErrors(deleteAccount.error);

	function cancel() {
		setConfirming(false);
		setConfirmation("");
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
							deleteAccount.mutate(hasPassword ? { currentPassword: confirmation } : { confirmEmail: confirmation });
						}}
					>
						<Stack gap="sm">
							{hasPassword ? (
								<PasswordInput
									label="Enter your password to confirm"
									value={confirmation}
									onChange={(event) => setConfirmation(event.currentTarget.value)}
									error={fieldErrors.current_password}
									required
									autoFocus
								/>
							) : (
								<TextInput
									label="Type your email to confirm"
									description={user?.email}
									type="email"
									autoComplete="off"
									value={confirmation}
									onChange={(event) => setConfirmation(event.currentTarget.value)}
									error={fieldErrors.confirm_email}
									required
									autoFocus
								/>
							)}
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
