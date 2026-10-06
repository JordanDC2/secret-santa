import { useState } from "react";
import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useCreateGroupMutation } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";

type ICreateGroupFormProps = {
	/** Called once it worked, e.g. to close the modal it's in. */
	onDone?: () => void;
};

export default function CreateGroupForm({ onDone }: ICreateGroupFormProps) {
	const createGroup = useCreateGroupMutation();
	const [name, setName] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		createGroup.mutate(
			{ name },
			{
				onSuccess: () => {
					setName("");
					onDone?.();
				},
			},
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack>
				{createGroup.isError && <Alert color="red">{apiErrorMessage(createGroup.error)}</Alert>}
				<Group align="flex-end" wrap="nowrap">
					<TextInput
						flex={1}
						data-autofocus
						label="Group name"
						placeholder="Office Secret Santa"
						value={name}
						onChange={(event) => setName(event.currentTarget.value)}
						required
					/>
					<Button type="submit" loading={createGroup.isPending}>
						Create group
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
