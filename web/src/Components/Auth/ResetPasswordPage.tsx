import { Anchor, Alert, Button, PasswordInput, Stack, Text as MantineText } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link, useSearchParams } from "react-router-dom";
import { AUTH_FIELD_NAMES, PASSWORD_HINT, useResetPasswordMutation } from "Components/Auth/hooks";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const email = searchParams.get("email");
	const resetPassword = useResetPasswordMutation();
	const form = useForm({ initialValues: { password: "", passwordConfirmation: "" } });

	function handleSubmit(values: typeof form.values) {
		if (token && email) {
			resetPassword.mutate(
				{ token, email, ...values },
				{ onError: (error) => form.setErrors(apiFieldErrors(error, AUTH_FIELD_NAMES)) },
			);
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
			<AuthLayout subtitle="You're back on the nice list!">
				<Stack>
					<Alert color="green" title="Password updated">
						{resetPassword.data.message}
					</Alert>
					<Button component={Link} to="/login">
						Log in
					</Button>
				</Stack>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout subtitle={`Choose a new password for ${email}`}>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{/* An expired or wrong link is reported against email or token, which have no field here. */}
					{resetPassword.isError && !form.errors.password && !form.errors.passwordConfirmation && (
						<Alert color="red">{apiErrorMessage(resetPassword.error)}</Alert>
					)}
					<PasswordInput
						label="New password"
						description={PASSWORD_HINT}
						autoComplete="new-password"
						required
						{...form.getInputProps("password")}
					/>
					<PasswordInput
						label="Confirm new password"
						autoComplete="new-password"
						required
						{...form.getInputProps("passwordConfirmation")}
					/>
					<Button type="submit" loading={resetPassword.isPending}>
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
