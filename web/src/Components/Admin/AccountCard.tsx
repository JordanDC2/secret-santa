import { Badge, Group, Paper, Stack, Text as MantineText } from "@mantine/core";
import AccountActionsMenu, { type IAccountAction } from "Components/Admin/AccountActionsMenu";
import { formatDate, timeAgo } from "Components/Admin/format";
import type { IAdminAccount } from "Components/Admin/types";
import classes from "Components/Admin/AdminLists.module.less";

type IAccountCardProps = {
	account: IAdminAccount;
	onAction: (action: IAccountAction) => void;
};

/** One person: who they are, when they were around, and the groups and kids they look after. */
export default function AccountCard({ account, onAction }: IAccountCardProps) {
	const kids = account.kidsAndPets.map((profile) => profile.name).join(", ");
	const memberOf = account.memberOf.map((group) => group.name).join(", ");

	return (
		<Paper withBorder radius="md" p="md" component="article">
			<Stack gap={6}>
				<Group justify="space-between" wrap="nowrap" align="flex-start">
					<div className={classes.heading}>
						<Group gap="xs">
							<MantineText fw={700}>{account.fullName}</MantineText>
							{account.isAdmin && (
								<Badge size="sm" variant="light" color="green">
									You
								</Badge>
							)}
							{!account.emailVerified && (
								<Badge size="sm" variant="light" color="orange">
									Email not confirmed
								</Badge>
							)}
						</Group>
						<MantineText size="sm" c="dimmed" className={classes.email}>
							{account.email}
						</MantineText>
					</div>
					<AccountActionsMenu account={account} onAction={onAction} />
				</Group>
				<MantineText size="xs" c="dimmed">
					Joined {formatDate(account.createdAt)} ·{" "}
					{account.lastSeenAt ? `Last seen ${timeAgo(account.lastSeenAt)}` : "Not seen recently"}
				</MantineText>
				{account.ownedGroups.length > 0 && (
					<Group gap={6}>
						<MantineText size="sm">Owns:</MantineText>
						{account.ownedGroups.map((group) => (
							<Badge key={group.id} variant="light" color="gray" className={classes.chip}>
								{group.name} · {group.membersCount} {group.membersCount === 1 ? "member" : "members"}
								{group.isDrawn && " · drawn"}
							</Badge>
						))}
					</Group>
				)}
				{memberOf && <MantineText size="sm">Member of: {memberOf}</MantineText>}
				{kids && <MantineText size="sm">Kids & pets: {kids}</MantineText>}
				{account.ownedGroups.length === 0 && !memberOf && (
					<MantineText size="sm" c="dimmed">
						Not in any groups yet.
					</MantineText>
				)}
			</Stack>
		</Paper>
	);
}
