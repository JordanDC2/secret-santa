import { useDeleteGroupMutation } from "Components/Groups/hooks";
import ConfirmAction, { type IConfirmState } from "Components/Groups/ConfirmAction";

type IDeleteGroupControlProps = IConfirmState & {
	groupId: number;
	groupName: string;
};

export default function DeleteGroupControl({ groupId, groupName, ...confirmState }: IDeleteGroupControlProps) {
	const deleteGroup = useDeleteGroupMutation();

	return (
		<ConfirmAction
			{...confirmState}
			triggerLabel="Delete group"
			triggerVariant="subtle"
			prompt={`Delete ${groupName}? Everyone loses access and any drawn names are gone for good. This can't be undone.`}
			confirmLabel="Yes, delete group"
			color="red"
			isPending={deleteGroup.isPending}
			error={deleteGroup.error}
			onConfirm={(onDone) => deleteGroup.mutate(groupId, { onSuccess: onDone })}
		/>
	);
}
