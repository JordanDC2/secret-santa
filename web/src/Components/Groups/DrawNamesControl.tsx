import { Button, Group, Text as MantineText } from "@mantine/core";
import Emoji from "Components/Common/Emoji";
import { useDrawNamesMutation } from "Components/Groups/hooks";
import ConfirmAction, { type IConfirmState } from "Components/Groups/ConfirmAction";

type IDrawNamesControlProps = IConfirmState & {
	groupId: number;
	membersCount: number;
};

export default function DrawNamesControl({ groupId, membersCount, ...confirmState }: IDrawNamesControlProps) {
	const drawNames = useDrawNamesMutation();

	if (membersCount < 2) {
		return (
			<Group gap="sm">
				<Button color="green" disabled leftSection={<Emoji>🎄</Emoji>}>
					Draw Names
				</Button>
				<MantineText size="sm" c="dimmed">
					Invite at least one more person to draw names.
				</MantineText>
			</Group>
		);
	}

	return (
		<ConfirmAction
			{...confirmState}
			triggerLabel="Draw Names"
			triggerLeftSection={<Emoji>🎄</Emoji>}
			prompt="Draw names now? Everyone will be emailed their assignment, and this can't be undone."
			confirmLabel="Yes, draw names"
			color="green"
			isPending={drawNames.isPending}
			error={drawNames.error}
			onConfirm={(onDone) => drawNames.mutate(groupId, { onSuccess: onDone })}
		/>
	);
}
