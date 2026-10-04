import { useEffect, useState, type KeyboardEvent } from "react";
import { Alert, Button, Group, Modal, Stack, Text as MantineText, Textarea } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import {
	useMarkSantaChatReadMutation,
	useSantaChatQuery,
	useSendSantaMessageMutation,
} from "Components/SantaChat/hooks";
import SantaChatThread from "Components/SantaChat/SantaChatThread";
import type { ISantaChatTarget } from "Components/SantaChat/types";
import { apiErrorMessage } from "Data/Api/Client";

/** Matches the server's limit. */
const MAX_LENGTH = 1000;

type ISantaChatModalProps = {
	target: ISantaChatTarget;
	opened: boolean;
	onClose: () => void;
};

/**
 * An anonymous thread between a Secret Santa and their person. The Santa sees their
 * person's name; the person only ever sees "Your Santa".
 */
export default function SantaChatModal({ target, opened, onClose }: ISantaChatModalProps) {
	const { groupId, groupName, side } = target;
	const threadQuery = useSantaChatQuery(groupId, side, opened);
	const send = useSendSantaMessageMutation(groupId, side);
	const markRead = useMarkSantaChatReadMutation(groupId, side);
	const [draft, setDraft] = useState(target.draft ?? "");
	const messages = threadQuery.data?.messages ?? [];
	const latest = messages.length > 0 ? messages[messages.length - 1] : null;
	const isSanta = side === "my-person";
	const theirName = isSanta ? (threadQuery.data?.with?.name ?? "your person") : "Your Santa";

	// Opening the thread, or a new reply arriving while it's open, counts as reading it.
	const latestTheirsId = latest && !latest.mine ? latest.id : null;
	const { mutate: markReadMutate } = markRead;
	useEffect(() => {
		if (opened && latestTheirsId !== null) {
			markReadMutate();
		}
	}, [opened, latestTheirsId, markReadMutate]);

	function submit() {
		const body = draft.trim();

		if (body && !send.isPending) {
			send.mutate(body, { onSuccess: () => setDraft("") });
		}
	}

	function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		// Enter sends; Shift+Enter starts a new line.
		if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			submit();
		}
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			size="lg"
			title={isSanta ? `Your Secret Santa chat with ${theirName}` : "Chat with your Secret Santa"}
		>
			<Stack gap="sm">
				<MantineText size="sm" c="dimmed">
					{isSanta
						? `${theirName} only sees you as "Your Santa" in ${groupName}. Ask about sizes, colors or what they already have.`
						: `Someone in ${groupName} drew you. They know it's you, but you won't find out who they are.`}
				</MantineText>

				{threadQuery.isError && <Alert color="red">{apiErrorMessage(threadQuery.error)}</Alert>}

				{threadQuery.isPending && <MantineText c="dimmed">Loading messages...</MantineText>}
				{threadQuery.isSuccess && (
					<SantaChatThread
						messages={messages}
						theirName={theirName}
						isSanta={isSanta}
						emptyMessage={
							isSanta ? `No messages yet. Ask ${theirName} something!` : "No messages yet. Say hello to your Santa!"
						}
					/>
				)}

				{send.isError && <Alert color="red">{apiErrorMessage(send.error)}</Alert>}

				<Textarea
					aria-label="Your message"
					placeholder={isSanta ? `Ask ${theirName} a question...` : "Write to your Santa..."}
					autosize
					minRows={2}
					maxRows={6}
					maxLength={MAX_LENGTH}
					data-autofocus
					// "Ask about this" starts the message for you, so type on after it.
					onFocus={(event) => {
						const end = event.currentTarget.value.length;
						event.currentTarget.setSelectionRange(end, end);
					}}
					value={draft}
					onChange={(event) => setDraft(event.currentTarget.value)}
					onKeyDown={onKeyDown}
				/>
				<Group justify="space-between">
					<MantineText size="xs" c="dimmed">
						Enter to send, Shift+Enter for a new line
					</MantineText>
					<Button
						leftSection={<FontAwesomeIcon icon={faPaperPlane} />}
						loading={send.isPending}
						disabled={!draft.trim()}
						onClick={submit}
					>
						Send
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
