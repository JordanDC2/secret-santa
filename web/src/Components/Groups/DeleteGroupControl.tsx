import { useDeleteGroupMutation } from "Components/Groups/hooks";
import ConfirmAction from "Components/Groups/ConfirmAction";

type IDeleteGroupControlProps = {
	groupId: number;
	groupName: string;
};

export default function DeleteGroupControl({ groupId, groupName }: IDeleteGroupControlProps) {
	const deleteGroup = useDeleteGroupMutation();

	return (
		<ConfirmAction
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
