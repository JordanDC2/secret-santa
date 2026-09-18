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
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "Data/Redux/Store";
import { register } from "Data/Redux/AuthSlice";

export default function RegisterPage() {
	const dispatch = useDispatch<AppDispatch>();
	const error = useSelector((state: RootState) => state.auth.error);
	const [ name, setName ] = useState("");
	const [ email, setEmail ] = useState("");
	const [ password, setPassword ] = useState("");
	const [ passwordConfirmation, setPasswordConfirmation ] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		dispatch(register({ name, email, password, passwordConfirmation }));
	}

	return (
		<Container size={ 420 } my={ 80 }>
			<Title ta="center">Secret Santa</Title>

			<Paper withBorder shadow="md" p={ 30 } mt={ 30 }
				radius="md">
				<form onSubmit={ handleSubmit }>
					<Stack>
						{ error && <Alert color="red">{ error }</Alert> }
						<TextInput
							label="Name"
							value={ name }
							onChange={ (event) => setName(event.currentTarget.value) }
							required
						/>
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
						<PasswordInput
							label="Confirm password"
							value={ passwordConfirmation }
							onChange={ (event) => setPasswordConfirmation(event.currentTarget.value) }
							required
						/>
						<Button type="submit">Create account</Button>
					</Stack>
				</form>
			</Paper>

			<MantineText ta="center" mt="md">
				Already have an account? <Anchor component={ Link } to="/login">Log in</Anchor>
			</MantineText>
		</Container>
	);
}
