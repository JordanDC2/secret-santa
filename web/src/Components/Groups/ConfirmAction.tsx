import { useState, type ReactNode } from "react";
import { Alert, Button, Group, Stack, Text as MantineText, type ButtonProps } from "@mantine/core";
import { apiErrorMessage } from "Data/Api/Client";

type IConfirmActionProps = {
	triggerLabel: ReactNode;
	triggerVariant?: ButtonProps["variant"];
	prompt: ReactNode;
	confirmLabel: string;
	color: string;
	isPending: boolean;
	error: Error | null;
	onConfirm: (onDone: () => void) => void;
};

/** A button that asks "are you sure?" inline before running an irreversible group action. */
export default function ConfirmAction({
	triggerLabel,
	triggerVariant = "filled",
	prompt,
	confirmLabel,
	color,
	isPending,
	error,
	onConfirm,
}: IConfirmActionProps) {
	const [confirming, setConfirming] = useState(false);

	return (
		<>
			{error && (
				<Alert color="red" mt="sm">
					{apiErrorMessage(error)}
				</Alert>
			)}

			{confirming ? (
				<Stack gap="xs" mt="md">
					<MantineText size="sm">{prompt}</MantineText>
					<Group>
						<Button color={color} loading={isPending} onClick={() => onConfirm(() => setConfirming(false))}>
							{confirmLabel}
						</Button>
						<Button variant="subtle" onClick={() => setConfirming(false)}>
							Cancel
						</Button>
					</Group>
				</Stack>
			) : (
				<Button mt="md" color={color} variant={triggerVariant} onClick={() => setConfirming(true)}>
					{triggerLabel}
				</Button>
			)}
		</>
	);
}
