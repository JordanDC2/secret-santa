import { Anchor, Alert, Button, Group, PasswordInput, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import { AUTH_FIELD_NAMES } from "Components/Auth/hooks";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function LoginPage() {
	const { login } = useAuth();
	const form = useForm({ initialValues: { email: "", password: "" } });

	function handleSubmit(values: typeof form.values) {
		login.mutate(values, { onError: (error) => form.setErrors(apiFieldErrors(error, AUTH_FIELD_NAMES)) });
	}

	return (
		<AuthLayout subtitle="Ho ho ho! Log in to find out who needs a gift.">
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{login.isError && Object.keys(form.errors).length === 0 && (
						<Alert color="red">{apiErrorMessage(login.error)}</Alert>
					)}
					<TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
					<PasswordInput
						label="Password"
						autoComplete="current-password"
						required
						{...form.getInputProps("password")}
					/>
					<Group justify="flex-end">
						<Anchor component={Link} to="/forgot-password" size="sm">
							Forgot password?
						</Anchor>
					</Group>
					<Button type="submit" loading={login.isPending}>
						Log in
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
