import { useState } from "react";
import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useCreateGroupMutation } from "Data/Hooks/Groups";
import { apiErrorMessage } from "Data/Api/Client";

export default function CreateGroupForm() {
	const createGroup = useCreateGroupMutation();
	const [ name, setName ] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		createGroup.mutate({ name }, { onSuccess: () => setName("") });
	}

	return (
		<form onSubmit={ handleSubmit }>
			<Stack>
				{ createGroup.isError && <Alert color="red">{ apiErrorMessage(createGroup.error) }</Alert> }
				<Group align="flex-end">
					<TextInput
						label="Group name"
						placeholder="Office Secret Santa"
						value={ name }
						onChange={ (event) => setName(event.currentTarget.value) }
						required
					/>
					<Button type="submit" loading={ createGroup.isPending }>Create group</Button>
				</Group>
			</Stack>
		</form>
	);
}
