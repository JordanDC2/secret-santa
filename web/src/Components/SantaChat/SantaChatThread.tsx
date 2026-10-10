import { useEffect, useRef } from "react";
import { ScrollArea, Stack, Text as MantineText } from "@mantine/core";
import type { ISantaMessage } from "Components/SantaChat/types";
import classes from "Components/SantaChat/SantaChatModal.module.less";

const sentAtFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

type ISantaChatThreadProps = {
	messages: ISantaMessage[];
	/** How the other side is labelled: their name for a Santa, "Your Santa" for their person. */
	theirName: string;
	/** Whether the viewer is the Santa here, so the Santa's messages can always be red. */
	isSanta: boolean;
	emptyMessage: string;
};

/** The messages, oldest first, kept scrolled to the newest. */
export default function SantaChatThread({ messages, theirName, isSanta, emptyMessage }: ISantaChatThreadProps) {
	const viewport = useRef<HTMLDivElement>(null);
	const latestId = messages.length > 0 ? messages[messages.length - 1].id : null;

	// Scroll to the bottom whenever a newer message arrives.
	useEffect(() => {
		if (latestId !== null) {
			viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
		}
	}, [latestId]);

	// When the window shrinks (a phone's keyboard opening), stay on the newest message if that's
	// where they were, like any messaging app.
	useEffect(() => {
		const element = viewport.current;

		if (!element) {
			return;
		}

		let atBottom = true;
		const onScroll = () => {
			atBottom = element.scrollHeight - element.clientHeight - element.scrollTop < 24;
		};
		const observer = new ResizeObserver(() => {
			if (atBottom) {
				element.scrollTo({ top: element.scrollHeight });
			}
		});

		element.addEventListener("scroll", onScroll, { passive: true });
		observer.observe(element);

		return () => {
			element.removeEventListener("scroll", onScroll);
			observer.disconnect();
		};
	}, []);

	return (
		<ScrollArea viewportRef={viewport} className={classes.thread}>
			<Stack gap="xs" p="sm">
				{messages.length === 0 && (
					<MantineText size="sm" c="dimmed" ta="center" py="md">
						{emptyMessage}
					</MantineText>
				)}
				{messages.map((message) => (
					<div
						key={message.id}
						className={[classes.bubble, message.mine && classes.mine, message.mine === isSanta && classes.fromSanta]
							.filter(Boolean)
							.join(" ")}
					>
						<MantineText size="xs" fw={700} className={classes.author}>
							{message.mine ? "You" : theirName}
						</MantineText>
						<MantineText size="sm" className={classes.body}>
							{message.body}
						</MantineText>
						<MantineText size="xs" ta="right" className={classes.sentAt}>
							{sentAtFormatter.format(new Date(message.sentAt))}
						</MantineText>
					</div>
				))}
			</Stack>
		</ScrollArea>
	);
}
