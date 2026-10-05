import { useState } from "react";
import {
	Alert,
	Button,
	Group,
	Modal,
	NumberInput,
	SegmentedControl,
	Stack,
	Text as MantineText,
	TextInput,
} from "@mantine/core";
import { exchangeDateRange } from "Components/Groups/exchange";
import { useUpdateGroupMutation } from "Components/Groups/hooks";
import type { IGroup } from "Components/Groups/types";
import { apiErrorMessage, apiFieldErrors } from "Data/Api/Client";

type IBudgetKind = "amount" | "range";

type IExchangeDetailsModalProps = {
	group: IGroup;
	opened: boolean;
	onClose: () => void;
};

/** Number inputs hand back "" when empty. */
function wholeDollars(value: string | number): number | null {
	return typeof value === "number" ? value : null;
}

/**
 * Owner-only: the exchange day and the budget (one amount, or a low-to-high range). Place
 * and time belong in the group note. Mounted fresh each time it opens, so it starts from
 * the group's current details.
 */
export default function ExchangeDetailsModal({ group, opened, onClose }: IExchangeDetailsModalProps) {
	const updateGroup = useUpdateGroupMutation();
	const [date, setDate] = useState(group.exchangeDate ?? "");
	const [budgetKind, setBudgetKind] = useState<IBudgetKind>(group.budget?.min != null ? "range" : "amount");
	const [budgetMin, setBudgetMin] = useState<string | number>(group.budget?.min ?? "");
	const [budgetMax, setBudgetMax] = useState<string | number>(group.budget?.max ?? "");
	const fieldErrors = apiFieldErrors(updateGroup.error);
	const isRange = budgetKind === "range";
	// Worked out once per opening (the modal mounts fresh each time).
	const [dateRange] = useState(() => exchangeDateRange(group.exchangeDate));

	function save(changes: { exchange_date: string | null; budget_min: number | null; budget_max: number | null }) {
		updateGroup.mutate({ groupId: group.id, changes }, { onSuccess: onClose });
	}

	return (
		<Modal opened={opened} onClose={onClose} title="Exchange date & budget" centered>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					save({
						exchange_date: date || null,
						budget_min: isRange ? wholeDollars(budgetMin) : null,
						budget_max: wholeDollars(budgetMax),
					});
				}}
			>
				<Stack>
					<TextInput
						type="date"
						label="Exchange date"
						description="Put the place and time in the group note."
						min={dateRange.min}
						max={dateRange.max}
						value={date}
						onChange={(event) => setDate(event.currentTarget.value)}
						error={fieldErrors.exchange_date}
					/>

					<Stack gap={6}>
						<Group justify="space-between" align="flex-end">
							<MantineText size="sm" fw={500}>
								Budget
							</MantineText>
							<SegmentedControl
								size="xs"
								value={budgetKind}
								onChange={(value) => setBudgetKind(value as IBudgetKind)}
								data={[
									{ value: "amount", label: "One amount" },
									{ value: "range", label: "Range" },
								]}
							/>
						</Group>
						<Group grow align="flex-start">
							{isRange && (
								<NumberInput
									aria-label="Lowest amount"
									placeholder="From"
									prefix="$"
									min={0}
									allowDecimal={false}
									thousandSeparator=","
									value={budgetMin}
									onChange={setBudgetMin}
									error={fieldErrors.budget_min}
								/>
							)}
							<NumberInput
								aria-label={isRange ? "Highest amount" : "Budget"}
								placeholder={isRange ? "To" : "e.g. $50"}
								prefix="$"
								min={1}
								allowDecimal={false}
								thousandSeparator=","
								value={budgetMax}
								onChange={setBudgetMax}
								error={fieldErrors.budget_max}
							/>
						</Group>
					</Stack>

					{updateGroup.isError && Object.keys(fieldErrors).length === 0 && (
						<Alert color="red">{apiErrorMessage(updateGroup.error)}</Alert>
					)}

					<Group justify="space-between">
						<Button
							variant="subtle"
							color="red"
							disabled={!group.exchangeDate && !group.budget}
							onClick={() => save({ exchange_date: null, budget_min: null, budget_max: null })}
						>
							Clear both
						</Button>
						<Group gap="sm">
							<Button variant="subtle" color="gray" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit" loading={updateGroup.isPending}>
								Save
							</Button>
						</Group>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
