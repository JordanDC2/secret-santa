import { useState } from "react";
import { ActionIcon, Group, TextInput, Title, Tooltip } from "@mantine/core";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useUpdateGroupMutation } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Groups/GroupNameEditor.module.less";

type IGroupNameEditorProps = {
	groupId: number;
	name: string;
	canRename: boolean;
};

/** The group's title; owners can click the pencil to rename it in place. */
export default function GroupNameEditor({ groupId, name, canRename }: IGroupNameEditorProps) {
	const renameGroup = useUpdateGroupMutation();
	const [draft, setDraft] = useState<string | null>(null);

	function stopEditing() {
		setDraft(null);
		renameGroup.reset();
	}

	function save() {
		const trimmed = draft?.trim() ?? "";

		if (trimmed === "" || trimmed === name) {
			stopEditing();
			return;
		}

		renameGroup.mutate({ groupId, changes: { name: trimmed } }, { onSuccess: stopEditing });
	}

	if (draft === null) {
		const lastSpace = name.lastIndexOf(" ");
		const leadingWords = name.slice(0, lastSpace + 1);
		const lastWord = name.slice(lastSpace + 1);

		return (
			<Title order={3} size="h4">
				{leadingWords}
				{/* The last word and the pencil never break apart, so the pencil can't wrap onto a line alone. */}
				<span className={classes.lastWord}>
					{lastWord}
					{canRename && (
						<Tooltip label="Rename group" withArrow>
							<ActionIcon
								variant="subtle"
								color="gray"
								size="sm"
								aria-label="Rename group"
								className={classes.renameButton}
								onClick={() => setDraft(name)}
							>
								<FontAwesomeIcon icon={faPenToSquare} />
							</ActionIcon>
						</Tooltip>
					)}
				</span>
			</Title>
		);
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				save();
			}}
		>
			<Group gap="xs" align="flex-start">
				<TextInput
					aria-label="Group name"
					value={draft}
					onChange={(event) => setDraft(event.currentTarget.value)}
					onKeyDown={(event) => event.key === "Escape" && stopEditing()}
					error={renameGroup.isError ? apiErrorMessage(renameGroup.error) : undefined}
					maxLength={255}
					autoFocus
					onFocus={(event) => event.currentTarget.select()}
				/>
				<ConfirmButtons confirmLabel="Save" isPending={renameGroup.isPending} onCancel={stopEditing} />
			</Group>
		</form>
	);
}
