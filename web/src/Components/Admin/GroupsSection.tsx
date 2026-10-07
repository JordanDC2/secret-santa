import { useState } from "react";
import { ActionIcon, Alert, Group, Paper, Stack, Text as MantineText, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";
import LoadingText from "Components/Common/LoadingText";
import ConfirmModal from "Components/Admin/ConfirmModal";
import { formatDate } from "Components/Admin/format";
import { useAdminGroupsQuery, useDeleteGroupMutation } from "Components/Admin/hooks";
import type { IAdminGroup } from "Components/Admin/types";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Admin/AdminLists.module.less";

/** "4 members · drawn (draw 2) · exchange Dec 20, 2026 · $30–$50" */
function groupDetails(group: IAdminGroup): string {
	return [
		`${group.membersCount} ${group.membersCount === 1 ? "member" : "members"}`,
		group.isDrawn ? (group.drawNumber > 1 ? `drawn (draw ${group.drawNumber})` : "drawn") : "not drawn",
		group.exchangeDate && `exchange ${formatDate(group.exchangeDate)}`,
		group.budget,
	]
		.filter(Boolean)
		.join(" · ");
}

/** Every group and who runs it. Never the draw itself: only whether one has happened. */
export default function GroupsSection() {
	const groups = useAdminGroupsQuery();
	const deleteGroup = useDeleteGroupMutation();
	const [deleting, setDeleting] = useState<IAdminGroup | null>(null);

	function close() {
		deleteGroup.reset();
		setDeleting(null);
	}

	return (
		<SectionCard title={groups.data ? `Groups (${groups.data.length})` : "Groups"}>
			<Stack gap="sm">
				{groups.isPending && <LoadingText>Loading groups...</LoadingText>}
				{groups.isError && <Alert color="red">{apiErrorMessage(groups.error)}</Alert>}
				{groups.data?.length === 0 && (
					<MantineText size="sm" c="dimmed">
						No groups yet.
					</MantineText>
				)}
				{groups.data?.map((group) => (
					<Paper key={group.id} withBorder radius="md" p="md" component="article">
						<Group justify="space-between" wrap="nowrap" align="flex-start">
							<div className={classes.heading}>
								<MantineText fw={700}>{group.name}</MantineText>
								<MantineText size="sm" c="dimmed" className={classes.email}>
									Owner: {group.owner.name} ({group.owner.email})
								</MantineText>
								<MantineText size="sm">{groupDetails(group)}</MantineText>
								<MantineText size="xs" c="dimmed">
									Created {formatDate(group.createdAt)}
								</MantineText>
							</div>
							<Tooltip label="Delete group" withArrow>
								<ActionIcon
									variant="subtle"
									color="red"
									aria-label={`Delete ${group.name}`}
									onClick={() => setDeleting(group)}
								>
									<FontAwesomeIcon icon={faTrashCan} />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Paper>
				))}
			</Stack>
			<ConfirmModal
				opened={deleting !== null}
				title={`Delete ${deleting?.name}?`}
				prompt={`${deleting?.name} is deleted for all ${deleting?.membersCount} members, with its draws, exclusions and Santa chats. Wishlists stay. This can't be undone.`}
				confirmLabel="Delete group"
				confirmPhrase="delete"
				isPending={deleteGroup.isPending}
				error={deleteGroup.error}
				onConfirm={() => deleting && deleteGroup.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
				onClose={close}
			/>
		</SectionCard>
	);
}
