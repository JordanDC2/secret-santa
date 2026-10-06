import { useState } from "react";
import {
	ActionIcon,
	Alert,
	Button,
	Checkbox,
	Group,
	Modal,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text as MantineText,
	Tooltip,
} from "@mantine/core";
import LoadingText from "Components/Common/LoadingText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowRightArrowLeft, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import { useAddExclusionMutation, useExclusionsQuery, useRemoveExclusionMutation } from "Components/Groups/hooks";
import type { IGroup, IGroupExclusion } from "Components/Groups/types";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

type IExclusionsModalProps = {
	group: IGroup;
	opened: boolean;
	onClose: () => void;
};

function describe(giver: string, receiver: string, mutual: boolean) {
	return mutual
		? `${giver} and ${receiver} won't draw each other.`
		: `${giver} won't draw ${receiver}. ${receiver} still might draw ${giver}.`;
}

function ExclusionRow({
	groupId,
	exclusion,
	sittingOut,
}: {
	groupId: number;
	exclusion: IGroupExclusion;
	/** Names of anyone in it who's sitting this draw out; then it doesn't apply for now. */
	sittingOut: string[];
}) {
	const removeExclusion = useRemoveExclusionMutation(groupId);
	const [confirming, setConfirming] = useState(false);
	const { giver, receiver, mutual } = exclusion;

	return (
		<Paper withBorder radius="md" px="md" py="xs" opacity={sittingOut.length > 0 ? 0.6 : 1}>
			<Group justify="space-between" wrap="nowrap">
				<div>
					<Group gap="xs" wrap="nowrap">
						<MantineText fw={600}>{giver.name}</MantineText>
						<FontAwesomeIcon icon={mutual ? faArrowRightArrowLeft : faArrowRight} />
						<MantineText fw={600}>{receiver.name}</MantineText>
					</Group>
					<MantineText size="sm" c="dimmed">
						{sittingOut.length > 0
							? `Not used this draw: ${sittingOut.join(" and ")} ${sittingOut.length === 1 ? "is" : "are"} sitting it out.`
							: describe(giver.name, receiver.name, mutual)}
					</MantineText>
				</div>
				{confirming ? (
					<ConfirmButtons
						size="xs"
						confirmLabel="Remove"
						color="red"
						isPending={removeExclusion.isPending}
						onConfirm={() => removeExclusion.mutate(exclusion.id)}
						onCancel={() => setConfirming(false)}
					/>
				) : (
					<Tooltip label="Remove" withArrow>
						<ActionIcon
							size="input-xs"
							variant="subtle"
							color="red"
							aria-label={`Remove exclusion between ${giver.name} and ${receiver.name}`}
							onClick={() => setConfirming(true)}
						>
							<FontAwesomeIcon icon={faTrashCan} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>
		</Paper>
	);
}

/** Owner-only: who can't draw whom. Changes are locked once names are drawn. */
export default function ExclusionsModal({ group, opened, onClose }: IExclusionsModalProps) {
	const exclusionsQuery = useExclusionsQuery(group.id, opened);
	const addExclusion = useAddExclusionMutation(group.id);
	const [giverId, setGiverId] = useState<string | null>(null);
	const [receiverId, setReceiverId] = useState<string | null>(null);
	const [mutual, setMutual] = useState(true);

	// Only people in the draw can be excluded from drawing each other.
	const memberOptions = group.members
		.filter((member) => member.inDraw)
		.map((member) => ({ value: String(member.id), label: member.name }));
	const sittingOutIds = new Set(group.members.filter((member) => !member.inDraw).map((member) => member.id));
	const nameOf = (id: string | null) => group.members.find((member) => String(member.id) === id)?.name;
	const fieldErrors = apiFieldErrors(addExclusion.error);
	// Person and Can't draw problems show by their fields; anything about the group as a whole above the button.
	const groupError = fieldErrors.group;

	function handleAdd(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!giverId || !receiverId) {
			return;
		}

		addExclusion.mutate(
			{ giverId: Number(giverId), receiverId: Number(receiverId), mutual },
			{
				onSuccess: () => {
					setGiverId(null);
					setReceiverId(null);
					setMutual(true);
				},
			},
		);
	}

	return (
		<Modal opened={opened} onClose={onClose} title={`Exclusions for ${group.name}`} centered size="lg">
			<Stack>
				<MantineText size="sm" c="dimmed">
					Keep certain people from drawing each other, like couples or siblings. Only you can see these.
				</MantineText>

				{exclusionsQuery.isPending && <LoadingText>Loading exclusions...</LoadingText>}
				{exclusionsQuery.isError && <Alert color="red">{apiErrorMessage(exclusionsQuery.error)}</Alert>}
				{exclusionsQuery.data?.length === 0 && (
					<MantineText size="sm" c="dimmed">
						No exclusions yet. Anyone can draw anyone except themselves.
					</MantineText>
				)}
				{exclusionsQuery.data?.map((exclusion) => (
					<ExclusionRow
						key={exclusion.id}
						groupId={group.id}
						exclusion={exclusion}
						sittingOut={[exclusion.giver, exclusion.receiver]
							.filter((person) => sittingOutIds.has(person.id))
							.map((person) => person.name)}
					/>
				))}

				<Paper withBorder radius="md" p="md" bg="gray.0">
					<form onSubmit={handleAdd}>
						<Stack gap="sm">
							<MantineText fw={600}>Add an exclusion</MantineText>
							{groupError && <Alert color="red">{groupError}</Alert>}
							{addExclusion.isError && Object.keys(fieldErrors).length === 0 && (
								<Alert color="red">{apiErrorMessage(addExclusion.error)}</Alert>
							)}
							{/* Side by side from xs up; stacked on narrow phones so names aren't cut off. */}
							<SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
								<Select
									// The modal focuses this on open, instead of its close button.
									data-autofocus
									label="Person"
									placeholder="Pick someone"
									data={memberOptions}
									value={giverId}
									onChange={(value) => {
										setGiverId(value);
										if (value === receiverId) {
											setReceiverId(null);
										}
									}}
									error={fieldErrors.giver_id}
									required
								/>
								<Select
									label="Can't draw"
									placeholder="Pick someone"
									data={memberOptions.filter((option) => option.value !== giverId)}
									value={receiverId}
									onChange={setReceiverId}
									error={fieldErrors.receiver_id}
									required
								/>
							</SimpleGrid>
							<Checkbox
								label="Both ways"
								description="Most exclusions, like couples, go both ways."
								checked={mutual}
								onChange={(event) => setMutual(event.currentTarget.checked)}
							/>
							{giverId && receiverId && (
								<MantineText size="sm">{describe(nameOf(giverId) ?? "", nameOf(receiverId) ?? "", mutual)}</MantineText>
							)}
							<Group justify="flex-end">
								<Button
									type="submit"
									loading={addExclusion.isPending}
									disabled={!giverId || !receiverId}
									leftSection={<FontAwesomeIcon icon={faPlus} />}
								>
									Add exclusion
								</Button>
							</Group>
						</Stack>
					</form>
				</Paper>
			</Stack>
		</Modal>
	);
}
