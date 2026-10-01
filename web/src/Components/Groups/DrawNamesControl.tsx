import { useState } from "react";
import { Alert, Button, Group, Stack, Text as MantineText } from "@mantine/core";
import { useDrawNamesMutation } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";

type IDrawNamesControlProps = {
	groupId: number;
};

export default function DrawNamesControl({ groupId }: IDrawNamesControlProps) {
	const drawNames = useDrawNamesMutation();
	const [confirming, setConfirming] = useState(false);

	return (
		<>
			{drawNames.isError && (
				<Alert color="red" mt="sm">
					{apiErrorMessage(drawNames.error)}
				</Alert>
			)}

			{confirming ? (
				<Stack gap="xs" mt="md">
					<MantineText size="sm">
						Draw names now? Everyone will be emailed their assignment, and this can&apos;t be undone.
					</MantineText>
					<Group>
						<Button
							color="green"
							loading={drawNames.isPending}
							onClick={() => drawNames.mutate(groupId, { onSuccess: () => setConfirming(false) })}
						>
							Yes, draw names
						</Button>
						<Button variant="subtle" onClick={() => setConfirming(false)}>
							Cancel
						</Button>
					</Group>
				</Stack>
			) : (
				<Button mt="md" color="green" onClick={() => setConfirming(true)}>
					🎄 Draw Names
				</Button>
			)}
		</>
	);
}
