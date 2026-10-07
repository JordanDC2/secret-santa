import { useState, type ReactNode } from "react";
import { Alert, Modal, Stack, Text as MantineText, TextInput } from "@mantine/core";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { apiErrorMessage } from "Data/Api/Client";

type IConfirmModalProps = {
	opened: boolean;
	title: string;
	prompt: ReactNode;
	confirmLabel: string;
	/** For deletes that can't be undone: the button stays off until this word is typed. */
	confirmPhrase?: string;
	/** Red for deletes (the default); green for anything else, like sending an email. */
	color?: "red" | "green";
	isPending: boolean;
	error: Error | null;
	onConfirm: () => void;
	onClose: () => void;
};

/** "Are you sure?" for the admin page's actions, which start from a ⋯ menu rather than a button. */
export default function ConfirmModal({
	opened,
	title,
	prompt,
	confirmLabel,
	confirmPhrase,
	color = "red",
	isPending,
	error,
	onConfirm,
	onClose,
}: IConfirmModalProps) {
	const [typed, setTyped] = useState("");
	const phraseMatches = !confirmPhrase || typed.trim().toLowerCase() === confirmPhrase.toLowerCase();

	function close() {
		setTyped("");
		onClose();
	}

	return (
		<Modal opened={opened} onClose={close} title={title} centered>
			<Stack>
				{typeof prompt === "string" ? <MantineText size="sm">{prompt}</MantineText> : prompt}
				{confirmPhrase && (
					<TextInput
						label={`Type "${confirmPhrase}" to confirm`}
						value={typed}
						onChange={(event) => setTyped(event.currentTarget.value)}
						autoComplete="off"
						data-autofocus
					/>
				)}
				{error && <Alert color="red">{apiErrorMessage(error)}</Alert>}
				<ConfirmButtons
					confirmLabel={confirmLabel}
					color={color === "red" ? "red" : undefined}
					isPending={isPending}
					disabled={!phraseMatches}
					onConfirm={onConfirm}
					onCancel={close}
				/>
			</Stack>
		</Modal>
	);
}
