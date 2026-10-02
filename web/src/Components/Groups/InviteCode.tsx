import { ActionIcon, Code, CopyButton, Group, Text as MantineText, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

type IInviteCodeProps = {
	code: string;
};

export default function InviteCode({ code }: IInviteCodeProps) {
	return (
		<Group gap={6}>
			<MantineText size="sm" c="dimmed">
				Invite code
			</MantineText>
			<Code fw={700}>{code}</Code>
			<CopyButton value={code}>
				{({ copied, copy }) => (
					<Tooltip label={copied ? "Copied!" : "Copy code"} withArrow>
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
		</Group>
	);
}
