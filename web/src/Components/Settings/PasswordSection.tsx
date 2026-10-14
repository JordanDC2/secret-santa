import { Alert, Button, Group, PasswordInput, Stack, Text as MantineText } from "@mantine/core";
import { useAuth } from "Components/Auth/AuthContext";
import { PASSWORD_HINT, useForgotPasswordMutation } from "Components/Auth/hooks";
import SectionCard from "Components/Common/SectionCard";
import { useForm } from "@mantine/form";
import { ACCOUNT_FIELD_NAMES, useUpdatePasswordMutation } from "Components/Settings/hooks";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

const EMPTY = { currentPassword: "", password: "", passwordConfirmation: "" };

export default function PasswordSection() {
	const { user } = useAuth();

	return user && !user.hasPassword ? <SetPasswordByEmail email={user.email} /> : <ChangePassword />;
}

/**
 * Someone who only uses "Continue with Google" has no password to type, so setting one goes
 * through an emailed link (the forgot-password one), which proves the inbox is theirs.
 */
function SetPasswordByEmail({ email }: { email: string }) {
	const sendLink = useForgotPasswordMutation();

	return (
		<SectionCard title="Password">
			<Stack>
				<MantineText size="sm">
					You log in with Google. Want a password as well, in case you can&apos;t use Google one day? We&apos;ll email
					you a link to set one.
				</MantineText>
				{sendLink.isSuccess && <Alert color="green">Link sent to {email}. It works for an hour.</Alert>}
				{sendLink.isError && <Alert color="red">{apiErrorMessage(sendLink.error)}</Alert>}
				<Group justify="flex-end">
					<Button loading={sendLink.isPending} disabled={sendLink.isSuccess} onClick={() => sendLink.mutate({ email })}>
						Email me a link
					</Button>
				</Group>
			</Stack>
		</SectionCard>
	);
}

function ChangePassword() {
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
					<PasswordInput
						label="New password"
						description={PASSWORD_HINT}
						autoComplete="new-password"
						required
						{...form.getInputProps("password")}
					/>
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
