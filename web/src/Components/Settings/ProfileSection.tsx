import { Alert, Button, Group, PasswordInput, SimpleGrid, Stack, Text as MantineText, TextInput } from "@mantine/core";
import SectionCard from "Components/Common/SectionCard";
import { useForm } from "@mantine/form";
import { ACCOUNT_FIELD_NAMES, useUpdateProfileMutation } from "Components/Settings/hooks";
import type { IUser } from "Components/Auth/types";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

export default function ProfileSection({ user }: { user: IUser }) {
	const updateProfile = useUpdateProfileMutation();
	const form = useForm({
		initialValues: { firstName: user.firstName, lastName: user.lastName ?? "", email: user.email, currentPassword: "" },
	});
	const emailChanged = form.values.email.trim().toLowerCase() !== user.email.toLowerCase();

	function handleSubmit(values: typeof form.values) {
		updateProfile.mutate(
			{
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				email: values.email.trim(),
				currentPassword: values.currentPassword,
			},
			{
				onSuccess: (saved) => {
					// The saved values become the new "unchanged" baseline.
					const savedValues = {
						firstName: saved.firstName,
						lastName: saved.lastName ?? "",
						email: saved.email,
						currentPassword: "",
					};
					form.setValues(savedValues);
					form.resetDirty(savedValues);
				},
				onError: (error) => form.setErrors(apiFieldErrors(error, ACCOUNT_FIELD_NAMES)),
			},
		);
	}

	return (
		<SectionCard title="Profile">
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{updateProfile.isSuccess && !form.isDirty() && (
						<Alert color="green">
							{updateProfile.data.emailVerified
								? "Profile saved."
								: `Profile saved. We sent a link to ${updateProfile.data.email} to confirm your new email.`}
						</Alert>
					)}
					{updateProfile.isError && Object.keys(form.errors).length === 0 && (
						<Alert color="red">{apiErrorMessage(updateProfile.error)}</Alert>
					)}
					<SimpleGrid cols={{ base: 1, xs: 2 }}>
						<TextInput label="First name" required {...form.getInputProps("firstName")} />
						<TextInput label="Last name" required {...form.getInputProps("lastName")} />
					</SimpleGrid>
					<MantineText size="xs" c="dimmed" mt={-8}>
						Groups see your first name, with your last name on your wishlist so people know it&apos;s you.
					</MantineText>
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
		</SectionCard>
	);
}
