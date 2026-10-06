import type { ReactNode } from "react";
import { Alert, Box, Button, Stack, Text as MantineText, type ButtonProps } from "@mantine/core";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Groups/ConfirmAction.module.less";

export type IConfirmState = {
	/** Whether the "are you sure?" panel is showing. The parent owns this so it can hide other controls. */
	confirming: boolean;
	onConfirmingChange: (confirming: boolean) => void;
};

type IConfirmActionProps = IConfirmState & {
	triggerLabel: ReactNode;
	triggerLeftSection?: ReactNode;
	triggerVariant?: ButtonProps["variant"];
	prompt: ReactNode;
	confirmLabel: string;
	/** "red" for anything that deletes, "green" otherwise. */
	color: "red" | "green";
	isPending: boolean;
	error: Error | null;
	onConfirm: (onDone: () => void) => void;
};

/** A button that asks "are you sure?" in a panel before running an irreversible group action. */
export default function ConfirmAction({
	confirming,
	onConfirmingChange,
	triggerLabel,
	triggerLeftSection,
	triggerVariant = "filled",
	prompt,
	confirmLabel,
	color,
	isPending,
	error,
	onConfirm,
}: IConfirmActionProps) {
	if (!confirming) {
		return (
			<Button
				color={color}
				variant={triggerVariant}
				leftSection={triggerLeftSection}
				onClick={() => onConfirmingChange(true)}
			>
				{triggerLabel}
			</Button>
		);
	}

	return (
		<Box className={classes.panel}>
			<Stack gap="md">
				<MantineText size="sm">{prompt}</MantineText>
				{error && <Alert color="red">{apiErrorMessage(error)}</Alert>}
				<ConfirmButtons
					confirmLabel={confirmLabel}
					color={color === "red" ? "red" : undefined}
					isPending={isPending}
					onConfirm={() => onConfirm(() => onConfirmingChange(false))}
					onCancel={() => onConfirmingChange(false)}
				/>
			</Stack>
		</Box>
	);
}
