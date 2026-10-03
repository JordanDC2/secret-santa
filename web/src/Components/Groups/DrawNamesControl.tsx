import { useState } from "react";
import { Button, Checkbox, Group, Stack, Text as MantineText } from "@mantine/core";
import Emoji from "Components/Common/Emoji";
import { useDrawNamesMutation } from "Components/Groups/hooks";
import ConfirmAction, { type IConfirmState } from "Components/Groups/ConfirmAction";

type IDrawNamesControlProps = IConfirmState & {
	groupId: number;
	membersCount: number;
	hasPreviousDraw: boolean;
};

export default function DrawNamesControl({
	groupId,
	membersCount,
	hasPreviousDraw,
	...confirmState
}: IDrawNamesControlProps) {
	const drawNames = useDrawNamesMutation();
	const [avoidPreviousMatches, setAvoidPreviousMatches] = useState(true);

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
			prompt={
				<Stack gap="sm">
					<span>Draw names now? Everyone will be emailed their assignment, and this can&apos;t be undone.</span>
					{hasPreviousDraw && (
						<Checkbox
							label="Avoid last draw's matches"
							description="Nobody gets the same person as last time."
							checked={avoidPreviousMatches}
							onChange={(event) => setAvoidPreviousMatches(event.currentTarget.checked)}
						/>
					)}
				</Stack>
			}
			confirmLabel="Yes, draw names"
			color="green"
			isPending={drawNames.isPending}
			error={drawNames.error}
			onConfirm={(onDone) =>
				drawNames.mutate(
					{ groupId, avoidPreviousMatches: hasPreviousDraw && avoidPreviousMatches },
					{ onSuccess: onDone },
				)
			}
		/>
	);
}
