import { Badge } from "@mantine/core";

/** The red count of unread Santa chat messages, wherever a button or menu item leads to them. */
export default function UnreadBadge({ count }: { count: number }) {
	if (count <= 0) {
		return null;
	}

	return (
		<Badge size="sm" circle color="red" aria-label={`${count} unread`}>
			{count}
		</Badge>
	);
}
