import { useStartNewDrawMutation } from "Components/Groups/hooks";
import ConfirmAction, { type IConfirmState } from "Components/Groups/ConfirmAction";

type IStartNewDrawControlProps = IConfirmState & {
	groupId: number;
	groupName: string;
};

/** Owner-only: opens the next draw (e.g. next Christmas) for the same group. */
export default function StartNewDrawControl({ groupId, groupName, ...confirmState }: IStartNewDrawControlProps) {
	const startNewDraw = useStartNewDrawMutation();

	return (
		<ConfirmAction
			{...confirmState}
			triggerLabel="Start a new draw"
			triggerVariant="default"
			prompt={`Start a new draw for ${groupName}? Everyone's current assignment comes off their card so you can draw names again. Members, exclusions, the note and every wishlist claim stay, and the last draw is kept so the next one can avoid repeating it.`}
			confirmLabel="Yes, start a new draw"
			color="green"
			isPending={startNewDraw.isPending}
			error={startNewDraw.error}
			onConfirm={(onDone) => startNewDraw.mutate(groupId, { onSuccess: onDone })}
		/>
	);
}
