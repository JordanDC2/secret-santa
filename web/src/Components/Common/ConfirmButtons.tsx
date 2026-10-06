import type { ReactNode } from "react";
import { Button, Group, type MantineSize } from "@mantine/core";

type IConfirmButtonsProps = {
	confirmLabel: ReactNode;
	/** E.g. the plus icon on "Add item". */
	confirmIcon?: ReactNode;
	/** "red" for anything that deletes; otherwise the green primary. */
	color?: "red";
	size?: MantineSize;
	isPending?: boolean;
	/** Omit to make the confirm button submit its form instead. */
	onConfirm?: () => void;
	onCancel: () => void;
	disabled?: boolean;
};

/**
 * The app's one order for "do it or back out", in modals, forms and "are you sure?" prompts
 * alike: right-aligned, Cancel (quiet) first, the action last.
 */
export default function ConfirmButtons({
	confirmLabel,
	confirmIcon,
	color,
	size = "sm",
	isPending = false,
	onConfirm,
	onCancel,
	disabled = false,
}: IConfirmButtonsProps) {
	return (
		// ml="auto" keeps them on the right even when they wrap below a prompt.
		<Group gap="xs" justify="flex-end" ml="auto">
			<Button size={size} variant="subtle" color="gray" onClick={onCancel}>
				Cancel
			</Button>
			<Button
				size={size}
				color={color}
				type={onConfirm ? "button" : "submit"}
				leftSection={confirmIcon}
				loading={isPending}
				disabled={disabled}
				onClick={onConfirm}
			>
				{confirmLabel}
			</Button>
		</Group>
	);
}
