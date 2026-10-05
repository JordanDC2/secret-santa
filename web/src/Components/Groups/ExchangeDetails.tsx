import { Badge, Group, UnstyledButton } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faWallet } from "@fortawesome/free-solid-svg-icons";
import { budgetLabel, countdownLabel, daysUntil } from "Components/Groups/exchange";
import type { IGroup } from "Components/Groups/types";

type IExchangeDetailsProps = {
	group: IGroup;
	/** Owners can click a chip to edit; everyone else just sees it. */
	onEdit?: () => void;
};

/** The exchange countdown and the budget as two small chips; nothing when neither is set. */
export default function ExchangeDetails({ group, onEdit }: IExchangeDetailsProps) {
	if (!group.exchangeDate && !group.budget) {
		return null;
	}

	const soon = group.exchangeDate !== null && daysUntil(group.exchangeDate) <= 1 && daysUntil(group.exchangeDate) >= 0;
	const chips = (
		<Group gap="xs" mt="xs">
			{group.exchangeDate && (
				<Badge
					variant="light"
					color={soon ? "red" : "green"}
					tt="none"
					size="lg"
					fw={600}
					leftSection={<FontAwesomeIcon icon={faCalendarDays} />}
				>
					{countdownLabel(group.exchangeDate)}
				</Badge>
			)}
			{group.budget && (
				<Badge
					variant="light"
					color="orange"
					tt="none"
					size="lg"
					fw={600}
					leftSection={<FontAwesomeIcon icon={faWallet} />}
				>
					{budgetLabel(group.budget)}
				</Badge>
			)}
		</Group>
	);

	return onEdit ? (
		<UnstyledButton onClick={onEdit} aria-label="Edit exchange date and budget" display="block">
			{chips}
		</UnstyledButton>
	) : (
		chips
	);
}
