import { useDrawNamesMutation } from "Components/Groups/hooks";
import ConfirmAction from "Components/Groups/ConfirmAction";

type IDrawNamesControlProps = {
	groupId: number;
};

export default function DrawNamesControl({ groupId }: IDrawNamesControlProps) {
	const drawNames = useDrawNamesMutation();

	return (
		<ConfirmAction
			triggerLabel="🎄 Draw Names"
			prompt="Draw names now? Everyone will be emailed their assignment, and this can't be undone."
			confirmLabel="Yes, draw names"
			color="green"
			isPending={drawNames.isPending}
			error={drawNames.error}
			onConfirm={(onDone) => drawNames.mutate(groupId, { onSuccess: onDone })}
		/>
	);
}
