import { Alert, Button, Group, PasswordInput, Stack } from "@mantine/core";
import SectionCard from "Components/Common/SectionCard";
import { useForm } from "@mantine/form";
import { ACCOUNT_FIELD_NAMES, useUpdatePasswordMutation } from "Components/Account/hooks";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

const EMPTY = { currentPassword: "", password: "", passwordConfirmation: "" };

export default function PasswordSection() {
	const updatePassword = useUpdatePasswordMutation();
	const form = useForm({ initialValues: EMPTY });

	function handleSubmit(values: typeof EMPTY) {
		updatePassword.mutate(values, {
			onSuccess: () => form.setValues(EMPTY),
			onError: (error) => form.setErrors(apiFieldErrors(error, ACCOUNT_FIELD_NAMES)),
		});
	}

	return (
		<SectionCard title="Password">
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{updatePassword.isSuccess && !form.isDirty() && <Alert color="green">Password updated.</Alert>}
					{updatePassword.isError && Object.keys(form.errors).length === 0 && (
						<Alert color="red">{apiErrorMessage(updatePassword.error)}</Alert>
					)}
					<PasswordInput label="Current password" required {...form.getInputProps("currentPassword")} />
					<PasswordInput label="New password" required {...form.getInputProps("password")} />
					<PasswordInput label="Confirm new password" required {...form.getInputProps("passwordConfirmation")} />
					<Group justify="flex-end">
						<Button type="submit" loading={updatePassword.isPending}>
							Change password
						</Button>
					</Group>
				</Stack>
			</form>
		</SectionCard>
	);
}
