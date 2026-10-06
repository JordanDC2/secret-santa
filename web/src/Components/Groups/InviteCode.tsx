import { ActionIcon, Code, CopyButton, Group, Text as MantineText, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import ShareInviteButton from "Components/Invites/ShareInviteButton";

type IInviteCodeProps = {
	code: string;
	groupName: string;
};

/** The group's join code, with two icon buttons: copy the code, and copy (or share) the invite link. */
export default function InviteCode({ code, groupName }: IInviteCodeProps) {
	return (
		<Group gap={6}>
			<MantineText size="sm" c="dimmed">
				Invite code
			</MantineText>
			<Code fw={700}>{code}</Code>
			<CopyButton value={code}>
				{({ copied, copy }) => (
					<Tooltip label={copied ? "Code copied!" : "Copy invite code"} withArrow>
						<ActionIcon
							variant="subtle"
							color={copied ? "green" : "gray"}
							size="sm"
							aria-label="Copy invite code"
							onClick={copy}
						>
							<FontAwesomeIcon icon={copied ? faCheck : faCopy} />
						</ActionIcon>
					</Tooltip>
				)}
			</CopyButton>
			<ShareInviteButton groupName={groupName} joinCode={code} />
		</Group>
	);
}
