import { useState } from "react";
import { Anchor, Alert, Button, PasswordInput, Stack, Text as MantineText } from "@mantine/core";
import { Link, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "Components/Auth/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";
import Emoji from "Components/Common/Emoji";

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const email = searchParams.get("email");
	const resetPassword = useResetPasswordMutation();
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (token && email) {
			resetPassword.mutate({ token, email, password, passwordConfirmation });
		}
	}

	if (!token || !email) {
		return (
			<AuthLayout subtitle="Hmm, this sleigh is missing a runner">
				<Alert color="red" title="This reset link is incomplete">
					Open the link straight from your email, or{" "}
					<Anchor component={Link} to="/forgot-password">
						request a new one
					</Anchor>
					.
				</Alert>
			</AuthLayout>
		);
	}

	if (resetPassword.isSuccess) {
		return (
			<AuthLayout subtitle="You're back on the nice list 🎄">
				<Stack>
					<Alert color="green" title="Password updated">
						{resetPassword.data.message}
					</Alert>
					<Button component={Link} to="/login" color="red" leftSection={<Emoji>🎄</Emoji>}>
						Log in
					</Button>
				</Stack>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout subtitle={`Choose a new password for ${email}`}>
			<form onSubmit={handleSubmit}>
				<Stack>
					{resetPassword.isError && <Alert color="red">{apiErrorMessage(resetPassword.error)}</Alert>}
					<PasswordInput
						label="New password"
						value={password}
						onChange={(event) => setPassword(event.currentTarget.value)}
						required
					/>
					<PasswordInput
						label="Confirm new password"
						value={passwordConfirmation}
						onChange={(event) => setPasswordConfirmation(event.currentTarget.value)}
						required
					/>
					<Button type="submit" color="red" loading={resetPassword.isPending} leftSection={<Emoji>🔑</Emoji>}>
						Reset password
					</Button>
				</Stack>
			</form>

			<MantineText ta="center" mt="md">
				Link expired?{" "}
				<Anchor component={Link} to="/forgot-password">
					Send a new one
				</Anchor>
			</MantineText>
		</AuthLayout>
	);
}
