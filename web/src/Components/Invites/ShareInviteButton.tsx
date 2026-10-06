import { useState } from "react";
import { ActionIcon, CopyButton, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faLink, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { inviteLink } from "Components/Invites/hooks";

type IShareInviteButtonProps = {
	groupName: string;
	joinCode: string;
};

/** Phones and tablets can hand the link to Messages, WhatsApp... directly. */
function canShare() {
	return typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * The group's invite link, styled exactly like the copy-code icon beside it: the share sheet
 * on phones, the clipboard elsewhere. Whoever opens it can sign up or log in and join.
 */
export default function ShareInviteButton({ groupName, joinCode }: IShareInviteButtonProps) {
	const [share] = useState(canShare);
	const link = inviteLink(joinCode);

	if (share) {
		return (
			<Tooltip label="Share invite link" withArrow>
				<ActionIcon
					variant="subtle"
					color="gray"
					size="sm"
					aria-label="Share invite link"
					onClick={() =>
						// Closing the share sheet rejects; there's nothing to do about it.
						void navigator
							.share({ title: `Join ${groupName}`, text: `Join ${groupName} on Secret Santa!`, url: link })
							.catch(() => undefined)
					}
				>
					<FontAwesomeIcon icon={faShareNodes} />
				</ActionIcon>
			</Tooltip>
		);
	}

	return (
		<CopyButton value={link}>
			{({ copied, copy }) => (
				<Tooltip label={copied ? "Link copied!" : "Copy invite link"} withArrow>
					<ActionIcon
						variant="subtle"
						color={copied ? "green" : "gray"}
						size="sm"
						aria-label="Copy invite link"
						onClick={copy}
					>
						<FontAwesomeIcon icon={copied ? faCheck : faLink} />
					</ActionIcon>
				</Tooltip>
			)}
		</CopyButton>
	);
}
