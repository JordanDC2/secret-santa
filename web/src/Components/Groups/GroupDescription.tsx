import { useState } from "react";
import { ActionIcon, Box, Button, Group, Text as MantineText, Textarea, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { useUpdateGroupMutation } from "Components/Groups/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Groups/GroupDescription.module.less";

const MAX_LENGTH = 1000;

type IGroupDescriptionProps = {
	groupId: number;
	description: string | null;
	canEdit: boolean;
};

function NoteLabel() {
	return (
		<MantineText size="xs" fw={700} tt="uppercase" c="dimmed" className={classes.label}>
			<FontAwesomeIcon icon={faThumbtack} /> Group note
		</MantineText>
	);
}

/** The owner's note to the group (budget, dates...). Everyone sees it; only the owner edits it. */
export default function GroupDescription({ groupId, description, canEdit }: IGroupDescriptionProps) {
	const updateGroup = useUpdateGroupMutation();
	const [draft, setDraft] = useState<string | null>(null);

	function stopEditing() {
		setDraft(null);
		updateGroup.reset();
	}

	if (draft !== null) {
		return (
			<Box
				component="form"
				className={classes.note}
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
					event.preventDefault();
					updateGroup.mutate({ groupId, changes: { description: draft.trim() || null } }, { onSuccess: stopEditing });
				}}
			>
				<NoteLabel />
				<Textarea
					aria-label="Group note"
					// Room for the focus glow, which extends a few pixels past the field.
					mt={5}
					placeholder="e.g. Let's keep gifts around $50. We swap on Dec 20 at Grandma's!"
					value={draft}
					onChange={(event) => setDraft(event.currentTarget.value)}
					onKeyDown={(event) => event.key === "Escape" && stopEditing()}
					maxLength={MAX_LENGTH}
					error={updateGroup.isError ? apiErrorMessage(updateGroup.error) : undefined}
					autosize
					minRows={2}
					autoFocus
				/>
				<Group justify="space-between" mt="xs">
					<MantineText size="xs" c="dimmed">
						{draft.length}/{MAX_LENGTH}
					</MantineText>
					<Group gap="xs">
						<Button size="xs" variant="subtle" color="gray" onClick={stopEditing}>
							Cancel
						</Button>
						<Button type="submit" size="xs" loading={updateGroup.isPending}>
							Save note
						</Button>
					</Group>
				</Group>
			</Box>
		);
	}

	if (!description) {
		return canEdit ? (
			<button type="button" className={classes.addNote} onClick={() => setDraft("")}>
				+ Add a group note, like a budget or exchange date
			</button>
		) : null;
	}

	return (
		<Box className={classes.note}>
			<Group gap={4} wrap="nowrap">
				<NoteLabel />
				{canEdit && (
					<Tooltip label="Edit note" withArrow>
						<ActionIcon
							variant="subtle"
							color="gray"
							size="xs"
							aria-label="Edit group note"
							onClick={() => setDraft(description)}
						>
							<FontAwesomeIcon icon={faPenToSquare} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
			<MantineText size="sm" className={classes.text}>
				{description}
			</MantineText>
		</Box>
	);
}
