import { useEffect, useState, type KeyboardEvent } from "react";
import { Alert, Button, Group, Modal, Stack, Text as MantineText, Textarea } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import LoadingText from "Components/Common/LoadingText";
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
import classes from "Components/SantaChat/SantaChatModal.module.less";
import { clearNotifications } from "Components/PushNotifications/devicePush";
import { chatPushTag } from "Components/SantaChat/types";

/** Matches the server's limit. */
const MAX_LENGTH = 1000;

type ISantaChatModalProps = {
	target: ISantaChatTarget;
	opened: boolean;
	onClose: () => void;
};

function chatTitle(isSanta: boolean, theirName: string, profileName?: string) {
	if (profileName) {
		return isSanta ? `${profileName}'s Secret Santa chat with ${theirName}` : `Chat with ${profileName}'s Secret Santa`;
	}

	return isSanta ? `Your Secret Santa chat with ${theirName}` : "Chat with your Secret Santa";
}

/**
 * An anonymous thread between a Secret Santa and their person. The Santa sees their
 * person's name; the person only ever sees "Your Santa".
 */
export default function SantaChatModal({ target, opened, onClose }: ISantaChatModalProps) {
	// The app's phone breakpoint (Styles/breakpoints.less @phone).
	const isPhone = useMediaQuery("(max-width: 36em)") ?? false;
	const { groupName, side, asProfile } = target;
	const threadQuery = useSantaChatQuery(target, opened);
	const send = useSendSantaMessageMutation(target);
	const markRead = useMarkSantaChatReadMutation(target);
	const [draft, setDraft] = useState(target.draft ?? "");
	const messages = threadQuery.data?.messages ?? [];
	const latest = messages.length > 0 ? messages[messages.length - 1] : null;
	const isSanta = side === "my-person";
	const theirName = isSanta
		? (threadQuery.data?.with?.name ?? "their person")
		: asProfile
			? `${asProfile.name}'s Santa`
			: "Your Santa";

	// Opening the thread, or a new reply arriving while it's open, counts as reading it, and
	// clears this chat's push notifications from this device.
	const latestTheirsId = latest && !latest.mine ? latest.id : null;
	const { mutate: markReadMutate } = markRead;
	const pushTag = chatPushTag(target);
	useEffect(() => {
		if (!opened) {
			return;
		}

		if (latestTheirsId !== null) {
			markReadMutate();
		}

		clearNotifications(pushTag).catch(() => {
			// Best effort: they can still swipe it away.
		});
	}, [opened, latestTheirsId, markReadMutate, pushTag]);

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
		// Full screen on phones, so the messages get every bit of height the keyboard leaves.
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			size="lg"
			fullScreen={isPhone}
			classNames={{ content: classes.content, body: classes.modalBody }}
			title={chatTitle(isSanta, theirName, asProfile?.name)}
		>
			<Stack gap="sm" className={classes.layout}>
				<MantineText size={isPhone ? "xs" : "sm"} c="dimmed">
					{asProfile
						? isSanta
							? `You're writing for ${asProfile.name}. ${theirName} only sees "Your Santa" in ${groupName}.`
							: `Someone in ${groupName} drew ${asProfile.name}. You're writing for ${asProfile.name}; you won't find out who their Santa is.`
						: isSanta
							? `${theirName} only sees you as "Your Santa" in ${groupName}. Ask about sizes, colors or what they already have.`
							: `Someone in ${groupName} drew you. They know it's you, but you won't find out who they are.`}
				</MantineText>

				{threadQuery.isError && <Alert color="red">{apiErrorMessage(threadQuery.error)}</Alert>}

				{threadQuery.isPending && <LoadingText>Loading messages...</LoadingText>}
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
					// One line on phones (it grows as they type), leaving more room for the messages.
					minRows={isPhone ? 1 : 2}
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
