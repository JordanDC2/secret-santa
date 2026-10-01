import { useState } from "react";
import { Anchor, Alert, Button, PasswordInput, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Contexts/Auth";
import { apiErrorMessage } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function RegisterPage() {
	const { register } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		register.mutate({ name, email, password, passwordConfirmation });
	}

	return (
		<AuthLayout subtitle="Join the nice list — create your account 🎁">
			<form onSubmit={handleSubmit}>
				<Stack>
					{register.isError && <Alert color="red">{apiErrorMessage(register.error)}</Alert>}
					<TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} required />
					<TextInput label="Email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
					<PasswordInput
						label="Password"
						value={password}
						onChange={(event) => setPassword(event.currentTarget.value)}
						required
					/>
					<PasswordInput
						label="Confirm password"
						value={passwordConfirmation}
						onChange={(event) => setPasswordConfirmation(event.currentTarget.value)}
						required
					/>
					<Button type="submit" color="red" loading={register.isPending}>
						🎄 Create account
					</Button>
				</Stack>
			</form>

			<MantineText ta="center" mt="md">
				Already have an account?{" "}
				<Anchor component={Link} to="/login">
					Log in
				</Anchor>
			</MantineText>
		</AuthLayout>
	);
}
