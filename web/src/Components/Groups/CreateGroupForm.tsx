import { useState } from "react";
import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "Data/Redux/Store";
import { createGroup } from "Data/Redux/GroupsSlice";

export default function CreateGroupForm() {
	const dispatch = useDispatch<AppDispatch>();
	const [ name, setName ] = useState("");
	const [ error, setError ] = useState<string | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		dispatch(createGroup({ name })).unwrap().then(
			() => {
				setError(null);
				setName("");
			},
			(rejection: string) => setError(rejection)
		);
	}

	return (
		<form onSubmit={ handleSubmit }>
			<Stack>
				{ error && <Alert color="red">{ error }</Alert> }
				<Group align="flex-end">
					<TextInput
						label="Group name"
						placeholder="Office Secret Santa"
						value={ name }
						onChange={ (event) => setName(event.currentTarget.value) }
						required
					/>
					<Button type="submit">Create group</Button>
				</Group>
			</Stack>
		</form>
	);
}
