import { useState } from "react";
import { Button, Container, Paper, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "Data/Redux/Store";
import { login } from "Data/Redux/AuthSlice";

export default function LoginPage() {
	const dispatch = useDispatch<AppDispatch>();
	const [ email, setEmail ] = useState("");
	const [ password, setPassword ] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		dispatch(login({ email, password }));
	}

	return (
		<Container size={ 420 } my={ 80 }>
			<Title ta="center">Secret Santa</Title>

			<Paper withBorder shadow="md" p={ 30 } mt={ 30 }
				radius="md">
				<form onSubmit={ handleSubmit }>
					<Stack>
						<TextInput
							label="Email"
							value={ email }
							onChange={ (event) => setEmail(event.currentTarget.value) }
							required
						/>
						<PasswordInput
							label="Password"
							value={ password }
							onChange={ (event) => setPassword(event.currentTarget.value) }
							required
						/>
						<Button type="submit">Log in</Button>
					</Stack>
				</form>
			</Paper>
		</Container>
	);
}
