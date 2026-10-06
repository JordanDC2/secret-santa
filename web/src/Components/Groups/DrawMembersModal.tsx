import { Alert, Button, Group, Modal, Stack, Switch, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChild, faPaw } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "Components/Auth/AuthContext";
import { useSetEveryoneInDrawMutation, useSetInDrawMutation } from "Components/Groups/hooks";
import type { IGroup } from "Components/Groups/types";
import { apiErrorMessage } from "Data/Api/Client";

type IDrawMembersModalProps = {
	group: IGroup;
	opened: boolean;
	onClose: () => void;
};

/**
 * Owner-only, before the draw: one switch per member. Everyone's in unless switched off;
 * anyone sitting out stays in the group, sees and shops everyone's lists, and still looks
 * after their kids' and pets' draws.
 */
export default function DrawMembersModal({ group, opened, onClose }: IDrawMembersModalProps) {
	const { user } = useAuth();
	const setInDraw = useSetInDrawMutation(group.id);
	const setEveryone = useSetEveryoneInDrawMutation(group.id);
	const inCount = group.members.filter((member) => member.inDraw).length;

	return (
		<Modal opened={opened} onClose={onClose} title={`Who's in the draw for ${group.name}`} centered>
			<Stack>
				<MantineText size="sm" c="dimmed">
					{inCount} of {group.members.length} in the draw. Anyone switched off stays in the group and can still see and
					shop everyone&apos;s lists; they just aren&apos;t drawn.
				</MantineText>
				<Group gap="xs">
					<Button
						size="xs"
						variant="secondary"
						disabled={inCount === group.members.length}
						loading={setEveryone.isPending && setEveryone.variables === true}
						onClick={() => setEveryone.mutate(true)}
					>
						Everyone
					</Button>
					<Button
						size="xs"
						variant="subtle"
						color="gray"
						disabled={inCount === 0}
						loading={setEveryone.isPending && setEveryone.variables === false}
						onClick={() => setEveryone.mutate(false)}
					>
						No one
					</Button>
				</Group>
				{setInDraw.isError && <Alert color="red">{apiErrorMessage(setInDraw.error)}</Alert>}
				{setEveryone.isError && <Alert color="red">{apiErrorMessage(setEveryone.error)}</Alert>}
				{group.members.map((member) => (
					<Switch
						key={member.id}
						checked={member.inDraw}
						disabled={setInDraw.isPending && setInDraw.variables?.memberId === member.id}
						onChange={(event) => setInDraw.mutate({ memberId: member.id, inDraw: event.currentTarget.checked })}
						label={
							<Group gap={6} wrap="nowrap">
								{member.kind && <FontAwesomeIcon icon={member.kind === "pet" ? faPaw : faChild} />}
								{member.id === user?.id ? "You" : member.name}
							</Group>
						}
					/>
				))}
			</Stack>
		</Modal>
	);
}
