import type { ReactNode } from "react";
import { Badge, Button, type ButtonProps } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, type IconDefinition } from "@fortawesome/free-solid-svg-icons";

type ISantaChatButtonProps = ButtonProps & {
	unread: number;
	onClick: () => void;
	children: ReactNode;
	/** Defaults to the chat bubbles. */
	icon?: IconDefinition;
};

/** Opens a Santa chat, with a red badge counting unread messages. */
export default function SantaChatButton({
	unread,
	onClick,
	children,
	icon = faComments,
	...buttonProps
}: ISantaChatButtonProps) {
	return (
		<Button
			variant="secondary"
			leftSection={<FontAwesomeIcon icon={icon} />}
			onClick={onClick}
			{...buttonProps}
			rightSection={
				unread > 0 ? (
					<Badge size="sm" circle color="red" aria-label={`${unread} unread`}>
						{unread}
					</Badge>
				) : undefined
			}
		>
			{children}
		</Button>
	);
}
