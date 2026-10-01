import { useState } from "react";
import { Button, Card, Stack, Text as MantineText, Title } from "@mantine/core";

type IAssignmentRevealProps = {
	recipientName: string;
};

export default function AssignmentReveal({ recipientName }: IAssignmentRevealProps) {
	const [revealed, setRevealed] = useState(false);

	return (
		<Card withBorder mt="md" padding="sm" radius="md" bg={revealed ? "green.0" : undefined}>
			{revealed ? (
				<Stack gap={4}>
					<MantineText size="sm" c="dimmed">
						You&apos;re the Secret Santa for:
					</MantineText>
					<Title order={4}>🎁 {recipientName}</Title>
					<Button variant="subtle" size="xs" onClick={() => setRevealed(false)}>
						Hide
					</Button>
				</Stack>
			) : (
				<Button variant="light" color="green" onClick={() => setRevealed(true)}>
					🎁 Reveal my assignment
				</Button>
			)}
		</Card>
	);
}
