import { Anchor, Alert, Button, PasswordInput, SimpleGrid, Stack, Text as MantineText, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import { AUTH_FIELD_NAMES } from "Components/Auth/hooks";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";
import AuthLayout from "Components/Layout/AuthLayout";

export default function RegisterPage() {
	const { register } = useAuth();
	const form = useForm({
		initialValues: { firstName: "", lastName: "", email: "", password: "", passwordConfirmation: "" },
	});

	function handleSubmit(values: typeof form.values) {
		register.mutate(values, { onError: (error) => form.setErrors(apiFieldErrors(error, AUTH_FIELD_NAMES)) });
	}

	return (
		<AuthLayout subtitle="Join the nice list and create your account.">
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{register.isError && Object.keys(form.errors).length === 0 && (
						<Alert color="red">{apiErrorMessage(register.error)}</Alert>
					)}
					<SimpleGrid cols={2}>
						<TextInput label="First name" autoComplete="given-name" required {...form.getInputProps("firstName")} />
						<TextInput label="Last name" autoComplete="family-name" required {...form.getInputProps("lastName")} />
					</SimpleGrid>
					<TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
					<PasswordInput label="Password" autoComplete="new-password" required {...form.getInputProps("password")} />
					<PasswordInput
						label="Confirm password"
						autoComplete="new-password"
						required
						{...form.getInputProps("passwordConfirmation")}
					/>
					<Button type="submit" loading={register.isPending}>
						Create account
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
