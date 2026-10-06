import { useState } from "react";
import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useJoinGroupMutation } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";

type IJoinGroupFormProps = {
	/** Called once it worked, e.g. to close the modal it's in. */
	onDone?: () => void;
};

export default function JoinGroupForm({ onDone }: IJoinGroupFormProps) {
	const joinGroup = useJoinGroupMutation();
	const [joinCode, setJoinCode] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		joinGroup.mutate(
			{ joinCode },
			{
				onSuccess: () => {
					setJoinCode("");
					onDone?.();
				},
			},
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack>
				{joinGroup.isError && <Alert color="red">{apiErrorMessage(joinGroup.error)}</Alert>}
				<Group align="flex-end" wrap="nowrap">
					<TextInput
						flex={1}
						data-autofocus
						label="Join code"
						placeholder="ABC123"
						value={joinCode}
						onChange={(event) => setJoinCode(event.currentTarget.value)}
						required
					/>
					<Button type="submit" loading={joinGroup.isPending}>
						Join group
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
