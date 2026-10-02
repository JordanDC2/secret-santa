import { useState } from "react";
import { Alert, Button, Group, List, Modal, Stack, Table, Text as MantineText, ThemeIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useDrawCheckQuery, useDrawPairsQuery } from "Components/Groups/hooks";
import type { IGroup } from "Components/Groups/types";
import { apiErrorMessage } from "Data/Api/Client";

type IDrawDetailsModalProps = {
	group: IGroup;
	opened: boolean;
	onClose: () => void;
};

/** Owner-only: a spoiler-free check that the draw is sound, and the full list behind a warning. */
export default function DrawDetailsModal({ group, opened, onClose }: IDrawDetailsModalProps) {
	const [revealed, setRevealed] = useState(false);
	const checkQuery = useDrawCheckQuery(group.id, opened);
	const pairsQuery = useDrawPairsQuery(group.id, opened && revealed);

	function close() {
		// Hide the list again so reopening the modal doesn't spoil anything by surprise.
		setRevealed(false);
		onClose();
	}

	return (
		<Modal opened={opened} onClose={close} title={`Draw details for ${group.name}`} centered size="lg">
			<Stack>
				{checkQuery.isPending && <MantineText c="dimmed">Checking the draw...</MantineText>}
				{checkQuery.isError && <Alert color="red">{apiErrorMessage(checkQuery.error)}</Alert>}
				{checkQuery.data && (
					<>
						<Alert
							color={checkQuery.data.verified ? "green" : "red"}
							title={checkQuery.data.verified ? "Draw verified 🎄" : "Something's off with this draw"}
						>
							{checkQuery.data.verified
								? "Everything checks out, without revealing who drew whom."
								: "See the details below."}
						</Alert>
						<List spacing="xs" center>
							{checkQuery.data.checks.map((check) => (
								<List.Item
									key={check.label}
									icon={
										<ThemeIcon color={check.passed ? "green" : "red"} size={22} radius="xl">
											<FontAwesomeIcon icon={check.passed ? faCheck : faXmark} size="xs" />
										</ThemeIcon>
									}
								>
									<MantineText size="sm">{check.label}</MantineText>
									{check.problems.map((problem) => (
										<MantineText key={problem} size="xs" c="red.8">
											{problem}
										</MantineText>
									))}
								</List.Item>
							))}
						</List>
					</>
				)}

				{!revealed ? (
					<Alert color="orange" title="Want to see every pair?">
						<MantineText size="sm" mb="sm">
							The full list shows who drew everyone, including who drew you. Once you look, your own surprise is
							spoiled.
						</MantineText>
						<Button color="orange" variant="light" size="xs" onClick={() => setRevealed(true)}>
							Show full list anyway
						</Button>
					</Alert>
				) : (
					<>
						{pairsQuery.isPending && <MantineText c="dimmed">Loading pairs...</MantineText>}
						{pairsQuery.isError && <Alert color="red">{apiErrorMessage(pairsQuery.error)}</Alert>}
						{pairsQuery.data && (
							<Table striped withTableBorder>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Secret Santa</Table.Th>
										<Table.Th>Buys for</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{pairsQuery.data.map((pair) => (
										<Table.Tr key={pair.giver.id}>
											<Table.Td>{pair.giver.name}</Table.Td>
											<Table.Td>🎁 {pair.receiver.name}</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						)}
						<Group justify="flex-end">
							<Button variant="subtle" color="gray" size="xs" onClick={() => setRevealed(false)}>
								Hide list
							</Button>
						</Group>
					</>
				)}
			</Stack>
		</Modal>
	);
}
