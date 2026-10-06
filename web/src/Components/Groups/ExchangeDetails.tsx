import { Badge, Group, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faWallet, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { budgetLabel, countdownLabel, daysUntil } from "Components/Groups/exchange";
import type { IGroup } from "Components/Groups/types";
import classes from "Components/Groups/ExchangeDetails.module.less";

type IExchangeDetailsProps = {
	group: IGroup;
	/** Owners can click a chip to edit; everyone else just sees it. */
	onEdit?: () => void;
};

type IChipProps = {
	color: string;
	icon: IconDefinition;
	/** Says what clicking edits, for owners. */
	editLabel: string;
	onEdit?: () => void;
	children: string;
};

/** One chip: plain for members, a button with its own hover for owners. */
function Chip({ color, icon, editLabel, onEdit, children }: IChipProps) {
	const shared = {
		variant: "light",
		color,
		tt: "none",
		size: "lg",
		fw: 600,
		leftSection: <FontAwesomeIcon icon={icon} />,
	} as const;

	return onEdit ? (
		<Tooltip label={editLabel} withArrow>
			<Badge
				{...shared}
				component="button"
				type="button"
				aria-label={`${editLabel}: ${children}`}
				className={classes.editable}
				onClick={onEdit}
			>
				{children}
			</Badge>
		</Tooltip>
	) : (
		<Badge {...shared}>{children}</Badge>
	);
}

/** The exchange countdown and the budget as two small chips; nothing when neither is set. */
export default function ExchangeDetails({ group, onEdit }: IExchangeDetailsProps) {
	if (!group.exchangeDate && !group.budget) {
		return null;
	}

	const days = group.exchangeDate === null ? null : daysUntil(group.exchangeDate);
	const soon = days !== null && days >= 0 && days <= 1;

	return (
		<Group gap="xs" mt="xs">
			{group.exchangeDate && (
				<Chip color={soon ? "red" : "green"} icon={faCalendarDays} editLabel="Edit exchange date" onEdit={onEdit}>
					{countdownLabel(group.exchangeDate)}
				</Chip>
			)}
			{group.budget && (
				<Chip color="orange" icon={faWallet} editLabel="Edit budget" onEdit={onEdit}>
					{budgetLabel(group.budget)}
				</Chip>
			)}
		</Group>
	);
}
