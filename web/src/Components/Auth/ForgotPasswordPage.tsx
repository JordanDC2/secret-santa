import { useState } from "react";
import { Anchor, Alert, Button, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "Components/Auth/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function ForgotPasswordPage() {
	const forgotPassword = useForgotPasswordMutation();
	const [email, setEmail] = useState("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		forgotPassword.mutate({ email });
	}

	return (
		<AuthLayout subtitle="Lost your password? The elves will send you a new key 🔑">
			{forgotPassword.isSuccess ? (
				<Alert color="green" title="Check your inbox">
					{forgotPassword.data.message} It may take a minute to arrive, so peek in your spam folder too.
				</Alert>
			) : (
				<form onSubmit={handleSubmit}>
					<Stack>
						{forgotPassword.isError && <Alert color="red">{apiErrorMessage(forgotPassword.error)}</Alert>}
						<TextInput
							label="Email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.currentTarget.value)}
							required
						/>
						<Button type="submit" color="red" loading={forgotPassword.isPending}>
							✉️ Send reset link
						</Button>
					</Stack>
				</form>
			)}

			<MantineText ta="center" mt="md">
				Remembered it?{" "}
				<Anchor component={Link} to="/login">
					Log in
				</Anchor>
			</MantineText>
		</AuthLayout>
	);
}
