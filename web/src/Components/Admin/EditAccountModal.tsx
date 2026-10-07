import { Alert, Modal, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { ADMIN_ACCOUNT_FIELD_NAMES, useUpdateAccountMutation } from "Components/Admin/hooks";
import type { IAdminAccount } from "Components/Admin/types";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

type IEditAccountModalProps = {
	account: IAdminAccount;
	onClose: () => void;
};

/** Fix someone's name or a mistyped email, e.g. when their assignment emails aren't arriving. */
export default function EditAccountModal({ account, onClose }: IEditAccountModalProps) {
	const updateAccount = useUpdateAccountMutation();
	const form = useForm({
		initialValues: { firstName: account.firstName, lastName: account.lastName ?? "", email: account.email },
	});

	function handleSubmit(values: typeof form.values) {
		updateAccount.mutate(
			{
				id: account.id,
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				email: values.email.trim(),
			},
			{
				onSuccess: onClose,
				onError: (error) => form.setErrors(apiFieldErrors(error, ADMIN_ACCOUNT_FIELD_NAMES)),
			},
		);
	}

	return (
		<Modal opened onClose={onClose} title={`Edit ${account.fullName}`} centered>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{updateAccount.isError && Object.keys(form.errors).length === 0 && (
						<Alert color="red">{apiErrorMessage(updateAccount.error)}</Alert>
					)}
					<SimpleGrid cols={{ base: 1, xs: 2 }}>
						<TextInput label="First name" required data-autofocus {...form.getInputProps("firstName")} />
						<TextInput label="Last name" required {...form.getInputProps("lastName")} />
					</SimpleGrid>
					<TextInput
						label="Email"
						description="They log in with this, and their emails go here. They aren't told it changed."
						type="email"
						required
						{...form.getInputProps("email")}
					/>
					<ConfirmButtons
						confirmLabel="Save changes"
						isPending={updateAccount.isPending}
						disabled={!form.isDirty()}
						onCancel={onClose}
					/>
				</Stack>
			</form>
		</Modal>
	);
}
