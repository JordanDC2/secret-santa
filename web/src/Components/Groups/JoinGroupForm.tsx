import { useState } from "react";
import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useJoinGroupMutation } from "Data/Hooks/Groups";
import { apiErrorMessage } from "Data/Api/Client";

export default function JoinGroupForm() {
	const joinGroup = useJoinGroupMutation();
	const [ joinCode, setJoinCode ] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		joinGroup.mutate({ joinCode }, { onSuccess: () => setJoinCode("") });
	}

	return (
		<form onSubmit={ handleSubmit }>
			<Stack>
				{ joinGroup.isError && <Alert color="red">{ apiErrorMessage(joinGroup.error) }</Alert> }
				<Group align="flex-end">
					<TextInput
						label="Join code"
						placeholder="ABC123"
						value={ joinCode }
						onChange={ (event) => setJoinCode(event.currentTarget.value) }
						required
					/>
					<Button type="submit" loading={ joinGroup.isPending }>Join group</Button>
				</Group>
			</Stack>
		</form>
	);
}
