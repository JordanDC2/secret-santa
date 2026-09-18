import { useState } from "react";
import {
	Anchor,
	Alert,
	Button,
	Container,
	Paper,
	PasswordInput,
	Stack,
	Text as MantineText,
	TextInput,
	Title
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Contexts/Auth";
import { apiErrorMessage } from "Data/Api/Client";

export default function LoginPage() {
	const { login } = useAuth();
	const [ email, setEmail ] = useState("");
	const [ password, setPassword ] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		login.mutate({ email, password });
	}

	return (
		<Container size={ 420 } my={ 80 }>
			<Title ta="center">Secret Santa</Title>

			<Paper withBorder shadow="md" p={ 30 } mt={ 30 }
				radius="md">
				<form onSubmit={ handleSubmit }>
					<Stack>
						{ login.isError && <Alert color="red">{ apiErrorMessage(login.error) }</Alert> }
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
						<Button type="submit" loading={ login.isPending }>Log in</Button>
					</Stack>
				</form>
			</Paper>

			<MantineText ta="center" mt="md">
				Don&apos;t have an account? <Anchor component={ Link } to="/register">Create one</Anchor>
			</MantineText>
		</Container>
	);
}
