import { useState } from "react";
import { Button, Group, Modal, Stack } from "@mantine/core";
import { useLocation } from "react-router-dom";
import { markSeen, unseenAnnouncement } from "Components/Announcements/seen";

/**
 * A centred message over the page, shown once on this device: news, results, anything
 * temporary. Each announcement (announcements.tsx) names the pages it shows on; the first one
 * this device hasn't seen shows when one of those pages is open. Closing it, either way, means
 * it's been seen.
 */
export default function Announcement() {
	const { pathname } = useLocation();
	// Re-read when it's closed, so the next one waiting for this page can show.
	const [closed, setClosed] = useState(0);
	const announcement = unseenAnnouncement(pathname);

	if (!announcement) {
		return null;
	}

	const close = () => {
		markSeen(announcement.id);
		setClosed(closed + 1);
	};

	return (
		<Modal opened onClose={close} centered size="md" title={announcement.title}>
			<Stack gap="md">
				{announcement.content}
				<Group justify="flex-end">
					<Button onClick={close}>{announcement.button ?? "Got it"}</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
