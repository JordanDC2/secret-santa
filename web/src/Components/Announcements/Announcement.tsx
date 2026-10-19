import { Fragment, useState } from "react";
import { Button, Divider, Group, Modal, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import type { IAnnouncement } from "Components/Announcements/announcements";
import { announcementsFor, markSeen, unseenAnnouncement } from "Components/Announcements/seen";

const RELEASED = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" });

/**
 * Release notes, centred over the page: the newest announcement with its date and time, and the
 * earlier ones under it, each divided off under its own. Closing it, either way, means the
 * newest has been seen.
 */
function ReleaseNotes({ announcements, onClose }: { announcements: IAnnouncement[]; onClose: () => void }) {
	const [newest, ...earlier] = announcements;

	const close = () => {
		markSeen(newest.id);
		onClose();
	};

	return (
		<Modal opened onClose={close} centered size="md" title={newest.title}>
			<Stack gap="md">
				<MantineText size="xs" c="dimmed">
					{RELEASED.format(new Date(newest.released))}
				</MantineText>
				{newest.content}
				{earlier.map((other) => (
					<Fragment key={other.id}>
						<Divider label={RELEASED.format(new Date(other.released))} labelPosition="left" />
						<MantineText fw={700}>{other.title}</MantineText>
						{other.content}
					</Fragment>
				))}
				<Group justify="flex-end">
					<Button onClick={close}>{newest.button ?? "Got it"}</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

/**
 * Shown once on this device: each announcement (announcements.tsx) names the pages it shows on,
 * and when this device hasn't seen a page's newest one, its release notes open.
 */
export default function Announcement() {
	const { pathname } = useLocation();
	// Re-read when it's closed.
	const [closed, setClosed] = useState(0);

	if (!unseenAnnouncement(pathname)) {
		return null;
	}

	return <ReleaseNotes announcements={announcementsFor(pathname)} onClose={() => setClosed(closed + 1)} />;
}

/** A quiet button that opens this page's release notes again, for a page that has some. */
export function WhatsNewButton() {
	const { pathname } = useLocation();
	const [open, setOpen] = useState(false);
	const announcements = announcementsFor(pathname);

	if (announcements.length === 0) {
		return null;
	}

	return (
		<>
			<Button
				variant="subtle"
				size="compact-sm"
				leftSection={<FontAwesomeIcon icon={faBullhorn} />}
				onClick={() => setOpen(true)}
			>
				What&apos;s new
			</Button>
			{open && <ReleaseNotes announcements={announcements} onClose={() => setOpen(false)} />}
		</>
	);
}
