import { List, Stack, Text as MantineText } from "@mantine/core";
import BulletList from "Components/Common/BulletList";
import { daysUntil } from "Components/Groups/exchange";
import { useLeaveGroupMutation } from "Components/Groups/hooks";
import ConfirmAction, { type IConfirmState } from "Components/Groups/ConfirmAction";
import type { IGroup } from "Components/Groups/types";

type ILeaveGroupControlProps = IConfirmState & {
	group: IGroup;
};

/**
 * Anyone but the owner can leave, even after the draw. Then it spells out what changes and
 * asks for "leave" to be typed, since their Santa ends up buying for someone else. It never
 * says who their Santa is.
 */
export default function LeaveGroupControl({ group, ...confirmState }: ILeaveGroupControlProps) {
	const leaveGroup = useLeaveGroupMutation();
	const exchangeOver = group.exchangeDate !== null && daysUntil(group.exchangeDate) < 0;
	const drawAhead = group.isDrawn && !exchangeOver;
	const hasKidsHere = group.members.some((member) => member.managedByMe);

	return (
		<ConfirmAction
			{...confirmState}
			triggerLabel="Leave group"
			triggerVariant="subtle"
			prompt={
				drawAhead ? (
					<Stack gap="xs">
						<MantineText size="sm">
							Names have already been drawn in <strong>{group.name}</strong>. If you leave:
						</MantineText>
						<BulletList size="sm">
							{group.myAssignment && (
								<List.Item>
									Whoever was buying for you will buy for {group.myAssignment.recipientName} instead, and they&apos;ll
									get an email about it. If that can&apos;t work, the group owner will be asked to draw names again.
								</List.Item>
							)}
							{hasKidsHere && (
								<List.Item>
									Your kids and pets here leave with you, unless someone else looking after them stays.
								</List.Item>
							)}
							<List.Item>You can&apos;t rejoin while names are drawn.</List.Item>
						</BulletList>
					</Stack>
				) : group.isDrawn ? (
					`Leave ${group.name}? The exchange is over, so nothing changes for anyone else. You can rejoin once the owner starts a new draw.`
				) : (
					`Leave ${group.name}? You can rejoin later with the invite code, as long as names haven't been drawn yet.`
				)
			}
			confirmPhrase={drawAhead ? "leave" : undefined}
			confirmLabel="Yes, leave group"
			color="red"
			isPending={leaveGroup.isPending}
			error={leaveGroup.error}
			onConfirm={(onDone) => leaveGroup.mutate(group.id, { onSuccess: onDone })}
		/>
	);
}
