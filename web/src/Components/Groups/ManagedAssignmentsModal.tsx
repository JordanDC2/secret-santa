import { useState } from "react";
import { ActionIcon, Button, Group, Modal, Paper, Stack, Text as MantineText, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { faChild, faListUl, faPaw } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import type { IManagedAssignment } from "Components/Groups/types";
import SantaChatButton from "Components/SantaChat/SantaChatButton";
import type { ISantaChatSide } from "Components/SantaChat/types";
import classes from "Components/Groups/ManagedAssignmentsModal.module.less";

type IManagedAssignmentsModalProps = {
	groupName: string;
	assignments: IManagedAssignment[];
	opened: boolean;
	onClose: () => void;
	/** Opens one of a kid's or pet's Santa chats (this modal closes first). */
	onOpenChat: (side: ISantaChatSide, asProfile: { id: number; name: string }) => void;
};

/**
 * Who each kid or pet you look after drew, and their Santa chats: one compact row each, so a
 * big family stays tidy. Names stay hidden until revealed, like your own assignment.
 */
export default function ManagedAssignmentsModal({
	groupName,
	assignments,
	opened,
	onClose,
	onOpenChat,
}: IManagedAssignmentsModalProps) {
	const [revealed, setRevealed] = useState<Set<number>>(new Set());

	function toggle(profileId: number) {
		setRevealed((current) => {
			const next = new Set(current);
			if (!next.delete(profileId)) {
				next.add(profileId);
			}

			return next;
		});
	}

	function close() {
		// Hidden again next time, so opening it doesn't spoil anything over someone's shoulder.
		setRevealed(new Set());
		onClose();
	}

	function openChat(side: ISantaChatSide, asProfile: { id: number; name: string }) {
		setRevealed(new Set());
		onOpenChat(side, asProfile);
	}

	return (
		<Modal opened={opened} onClose={close} title={`Kids & pets in ${groupName}`} centered size="lg">
			<Stack gap="sm">
				{assignments.map(({ profile, recipient, santa }) => {
					const asProfile = { id: profile.id, name: profile.name };
					const isRevealed = revealed.has(profile.id);

					return (
						<Paper key={profile.id} withBorder radius="md" p="sm" className={classes.row}>
							<Group justify="space-between" gap="xs" wrap="nowrap">
								<Group gap="sm" wrap="nowrap">
									<FontAwesomeIcon icon={profile.kind === "pet" ? faPaw : faChild} fixedWidth />
									<div>
										<MantineText fw={700}>{profile.name}</MantineText>
										{recipient && (
											<MantineText size="sm" c="dimmed">
												Secret Santa for{" "}
												{isRevealed ? (
													<strong className={classes.name}>{recipient.name}</strong>
												) : (
													<span aria-label="hidden">••••••</span>
												)}
											</MantineText>
										)}
									</div>
								</Group>
								{recipient && (
									<Tooltip label={isRevealed ? "Hide" : "Reveal"} withArrow>
										<ActionIcon
											variant="subtle"
											color="gray"
											aria-label={isRevealed ? `Hide who ${profile.name} drew` : `Reveal who ${profile.name} drew`}
											onClick={() => toggle(profile.id)}
										>
											<FontAwesomeIcon icon={isRevealed ? faEyeSlash : faEye} />
										</ActionIcon>
									</Tooltip>
								)}
							</Group>
							<Group gap="xs" mt="xs" className={classes.buttons}>
								{recipient && (
									<>
										<SantaChatButton
											size="xs"
											unread={recipient.unreadMessages}
											onClick={() => openChat("my-person", asProfile)}
										>
											{isRevealed ? `Ask ${recipient.name}` : "Ask their person"}
										</SantaChatButton>
										{isRevealed && (
											<Button
												component={Link}
												to={`/wishlists/${recipient.id}`}
												size="xs"
												variant="secondary"
												leftSection={<FontAwesomeIcon icon={faListUl} />}
											>
												Wishlist
											</Button>
										)}
									</>
								)}
								{santa && (
									<SantaChatButton
										size="xs"
										unread={santa.unreadMessages}
										onClick={() => openChat("my-santa", asProfile)}
									>
										Message {profile.name}&apos;s Santa
									</SantaChatButton>
								)}
							</Group>
						</Paper>
					);
				})}
			</Stack>
		</Modal>
	);
}
