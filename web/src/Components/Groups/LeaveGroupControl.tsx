import { useLeaveGroupMutation } from "Components/Groups/hooks";
import ConfirmAction, { type IConfirmState } from "Components/Groups/ConfirmAction";

type ILeaveGroupControlProps = IConfirmState & {
	groupId: number;
	groupName: string;
};

export default function LeaveGroupControl({ groupId, groupName, ...confirmState }: ILeaveGroupControlProps) {
	const leaveGroup = useLeaveGroupMutation();

	return (
		<ConfirmAction
			{...confirmState}
			triggerLabel="Leave group"
			triggerVariant="subtle"
			prompt={`Leave ${groupName}? You can rejoin later with the invite code, as long as names haven't been drawn yet.`}
			confirmLabel="Yes, leave group"
			color="red"
			isPending={leaveGroup.isPending}
			error={leaveGroup.error}
			onConfirm={(onDone) => leaveGroup.mutate(groupId, { onSuccess: onDone })}
		/>
	);
}
