import { useState } from "react";
import { Alert, List, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import BulletList from "Components/Common/BulletList";
import SectionCard from "Components/Common/SectionCard";
import LoadingText from "Components/Common/LoadingText";
import AccountCard from "Components/Admin/AccountCard";
import type { IAccountAction } from "Components/Admin/AccountActionsMenu";
import ConfirmModal from "Components/Admin/ConfirmModal";
import EditAccountModal from "Components/Admin/EditAccountModal";
import { useAdminAccountsQuery, useDeleteAccountMutation, useSendPasswordResetMutation } from "Components/Admin/hooks";
import type { IAdminAccount } from "Components/Admin/types";
import { apiErrorMessage } from "Data/Api/Client";

function matches(account: IAdminAccount, search: string): boolean {
	const needle = search.trim().toLowerCase();
	const haystack = [account.fullName, account.email, ...account.ownedGroups.map((group) => group.name)];

	return needle === "" || haystack.some((text) => text.toLowerCase().includes(needle));
}

/** Same consequences as deleting your own account on the Settings page. */
function DeleteAccountPrompt({ account }: { account: IAdminAccount }) {
	const onlyTheirs = account.kidsAndPets.filter((profile) => profile.onlyCarer);

	return (
		<Stack gap="xs">
			<MantineText size="sm">
				This permanently deletes {account.fullName}&apos;s account and wishlist. Gifts they claimed on other lists
				become available again. It can&apos;t be undone.
			</MantineText>
			{onlyTheirs.length > 0 && (
				<Alert color="red" title="These kids and pets only they look after go too">
					<BulletList size="sm">
						{onlyTheirs.map((profile) => (
							<List.Item key={profile.id}>{profile.name}</List.Item>
						))}
					</BulletList>
				</Alert>
			)}
			{account.ownedGroups.length > 0 && (
				<Alert color="red" title="These groups they own will be deleted for everyone">
					<BulletList size="sm">
						{account.ownedGroups.map((group) => (
							<List.Item key={group.id}>{group.name}</List.Item>
						))}
					</BulletList>
				</Alert>
			)}
		</Stack>
	);
}

export default function AccountsSection() {
	const accounts = useAdminAccountsQuery();
	const sendReset = useSendPasswordResetMutation();
	const deleteAccount = useDeleteAccountMutation();
	const [search, setSearch] = useState("");
	const [pending, setPending] = useState<{ action: IAccountAction; account: IAdminAccount } | null>(null);
	const shown = (accounts.data ?? []).filter((account) => matches(account, search));

	function close() {
		sendReset.reset();
		deleteAccount.reset();
		setPending(null);
	}

	return (
		<SectionCard title={accounts.data ? `Accounts (${accounts.data.length})` : "Accounts"}>
			<Stack gap="sm">
				<TextInput
					aria-label="Search accounts"
					placeholder="Search by name, email or group"
					leftSection={<FontAwesomeIcon icon={faMagnifyingGlass} />}
					value={search}
					onChange={(event) => setSearch(event.currentTarget.value)}
				/>
				{sendReset.isSuccess && <Alert color="green">{sendReset.data.message}</Alert>}
				{accounts.isPending && <LoadingText>Loading accounts...</LoadingText>}
				{accounts.isError && <Alert color="red">{apiErrorMessage(accounts.error)}</Alert>}
				{accounts.data && shown.length === 0 && (
					<MantineText size="sm" c="dimmed">
						No accounts match &quot;{search}&quot;.
					</MantineText>
				)}
				{shown.map((account) => (
					<AccountCard key={account.id} account={account} onAction={(action) => setPending({ action, account })} />
				))}
			</Stack>
			{pending?.action === "edit" && <EditAccountModal account={pending.account} onClose={close} />}
			<ConfirmModal
				opened={pending?.action === "passwordReset"}
				title="Send a password reset link?"
				prompt={`${pending?.account.fullName} gets the same email as "Forgot password?", sent to ${pending?.account.email}.`}
				confirmLabel="Send link"
				color="green"
				isPending={sendReset.isPending}
				error={sendReset.error}
				onConfirm={() => pending && sendReset.mutate(pending.account.id, { onSuccess: () => setPending(null) })}
				onClose={close}
			/>
			<ConfirmModal
				opened={pending?.action === "delete"}
				title={`Delete ${pending?.account.fullName}'s account?`}
				prompt={pending && <DeleteAccountPrompt account={pending.account} />}
				confirmLabel="Delete account"
				confirmPhrase="delete"
				isPending={deleteAccount.isPending}
				error={deleteAccount.error}
				onConfirm={() => pending && deleteAccount.mutate(pending.account.id, { onSuccess: () => setPending(null) })}
				onClose={close}
			/>
		</SectionCard>
	);
}
