import { useState } from "react";
import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "Data/Redux/Store";
import { joinGroup } from "Data/Redux/GroupsSlice";

export default function JoinGroupForm() {
	const dispatch = useDispatch<AppDispatch>();
	const [ joinCode, setJoinCode ] = useState("");
	const [ error, setError ] = useState<string | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		dispatch(joinGroup({ joinCode })).unwrap().then(
			() => {
				setError(null);
				setJoinCode("");
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
						label="Join code"
						placeholder="ABC123"
						value={ joinCode }
						onChange={ (event) => setJoinCode(event.currentTarget.value) }
						required
					/>
					<Button type="submit">Join group</Button>
				</Group>
			</Stack>
		</form>
	);
}
