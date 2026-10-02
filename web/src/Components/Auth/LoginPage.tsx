import { useState } from "react";
import { Anchor, Alert, Button, Group, PasswordInput, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import { apiErrorMessage } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function LoginPage() {
	const { login } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		login.mutate({ email, password });
	}

	return (
		<AuthLayout subtitle="Ho ho ho! Sign in to find out who needs a gift 🎁">
			<form onSubmit={handleSubmit}>
				<Stack>
					{login.isError && <Alert color="red">{apiErrorMessage(login.error)}</Alert>}
					<TextInput label="Email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
					<PasswordInput
						label="Password"
						value={password}
						onChange={(event) => setPassword(event.currentTarget.value)}
						required
					/>
					<Group justify="flex-end">
						<Anchor component={Link} to="/forgot-password" size="sm">
							Forgot password?
						</Anchor>
					</Group>
					<Button type="submit" color="red" loading={login.isPending}>
						🎄 Log in
					</Button>
				</Stack>
			</form>

			<MantineText ta="center" mt="md">
				Don&apos;t have an account?{" "}
				<Anchor component={Link} to="/register">
					Create one
				</Anchor>
			</MantineText>
		</AuthLayout>
	);
}
