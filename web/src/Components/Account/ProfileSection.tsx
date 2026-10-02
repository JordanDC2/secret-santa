import { Alert, Button, Card, Group, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ACCOUNT_FIELD_NAMES, useUpdateProfileMutation } from "Components/Account/hooks";
import type { IUser } from "Components/Auth/types";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

export default function ProfileSection({ user }: { user: IUser }) {
	const updateProfile = useUpdateProfileMutation();
	const form = useForm({ initialValues: { name: user.name, email: user.email, currentPassword: "" } });
	const emailChanged = form.values.email.trim().toLowerCase() !== user.email.toLowerCase();

	function handleSubmit(values: typeof form.values) {
		updateProfile.mutate(
			{ name: values.name.trim(), email: values.email.trim(), currentPassword: values.currentPassword },
			{
				onSuccess: (saved) => {
					// The saved values become the new "unchanged" baseline.
					const savedValues = { name: saved.name, email: saved.email, currentPassword: "" };
					form.setValues(savedValues);
					form.resetDirty(savedValues);
				},
				onError: (error) => form.setErrors(apiFieldErrors(error, ACCOUNT_FIELD_NAMES)),
			},
		);
	}

	return (
		<Card withBorder padding="lg" radius="md">
			<Title order={4} mb="md">
				Profile
			</Title>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{updateProfile.isSuccess && !form.isDirty() && <Alert color="green">Profile saved.</Alert>}
					{updateProfile.isError && Object.keys(form.errors).length === 0 && (
						<Alert color="red">{apiErrorMessage(updateProfile.error)}</Alert>
					)}
					<TextInput
						label="Name"
						description="What your groups see on cards and wishlists."
						required
						{...form.getInputProps("name")}
					/>
					<TextInput
						label="Email"
						description="You log in with this, and assignment emails go here."
						type="email"
						required
						{...form.getInputProps("email")}
					/>
					{emailChanged && (
						<PasswordInput
							label="Current password"
							description="Needed to change your email."
							required
							{...form.getInputProps("currentPassword")}
						/>
					)}
					<Group justify="flex-end">
						<Button type="submit" loading={updateProfile.isPending} disabled={!form.isDirty()}>
							Save profile
						</Button>
					</Group>
				</Stack>
			</form>
		</Card>
	);
}
