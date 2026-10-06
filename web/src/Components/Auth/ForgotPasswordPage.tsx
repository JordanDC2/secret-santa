import { Anchor, Alert, Button, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { AUTH_FIELD_NAMES, useForgotPasswordMutation } from "Components/Auth/hooks";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function ForgotPasswordPage() {
	const forgotPassword = useForgotPasswordMutation();
	const form = useForm({ initialValues: { email: "" } });

	function handleSubmit(values: typeof form.values) {
		forgotPassword.mutate(values, { onError: (error) => form.setErrors(apiFieldErrors(error, AUTH_FIELD_NAMES)) });
	}

	return (
		<AuthLayout subtitle="Lost your password? The elves will send you a new key.">
			{forgotPassword.isSuccess ? (
				<Alert color="green" title="Check your inbox">
					{forgotPassword.data.message} It may take a minute to arrive, so peek in your spam folder too.
				</Alert>
			) : (
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						{forgotPassword.isError && Object.keys(form.errors).length === 0 && (
							<Alert color="red">{apiErrorMessage(forgotPassword.error)}</Alert>
						)}
						<TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
						<Button
							type="submit"
							loading={forgotPassword.isPending}
							leftSection={<FontAwesomeIcon icon={faPaperPlane} />}
						>
							Send reset link
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
