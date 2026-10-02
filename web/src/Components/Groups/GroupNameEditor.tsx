import { useState } from "react";
import { ActionIcon, Button, Group, TextInput, Title, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { useUpdateGroupMutation } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";

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
		return (
			<Group gap={6} wrap="nowrap">
				<Title order={4}>{name}</Title>
				{canRename && (
					<Tooltip label="Rename group" withArrow>
						<ActionIcon
							variant="subtle"
							color="gray"
							size="sm"
							aria-label="Rename group"
							onClick={() => setDraft(name)}
						>
							<FontAwesomeIcon icon={faPenToSquare} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
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
				<Button type="submit" size="sm" loading={renameGroup.isPending}>
					Save
				</Button>
				<Button size="sm" variant="subtle" color="gray" onClick={stopEditing}>
					Cancel
				</Button>
			</Group>
		</form>
	);
}
