import { Group, Text as MantineText, Tooltip, VisuallyHidden } from "@mantine/core";
import { formatDate } from "Components/Admin/format";
import type { ISignUpDay } from "Components/Admin/types";
import classes from "Components/Admin/SignUpsChart.module.less";

/**
 * New accounts per day for the last 30 days: one bar per day, hover (or focus) a bar for its
 * date and count. A single series, so no legend; the card's title names it.
 */
export default function SignUpsChart({ days }: { days: ISignUpDay[] }) {
	const most = Math.max(1, ...days.map((day) => day.count));
	const total = days.reduce((sum, day) => sum + day.count, 0);

	return (
		<figure className={classes.figure}>
			<MantineText size="sm" c="dimmed">
				{total === 1 ? "1 new account" : `${total} new accounts`}
			</MantineText>
			<div className={classes.plot} role="list" aria-label="Sign-ups per day">
				{days.map((day) => (
					<Tooltip key={day.date} label={`${formatDate(day.date)}: ${day.count}`} withArrow>
						<div className={classes.slot} role="listitem" tabIndex={0}>
							<div
								className={day.count > 0 ? classes.bar : classes.empty}
								// The bar's height is the data, so it's set here rather than in the stylesheet.
								style={{ height: day.count > 0 ? `${(day.count / most) * 100}%` : undefined }}
							/>
							<VisuallyHidden>{`${formatDate(day.date)}: ${day.count}`}</VisuallyHidden>
						</div>
					</Tooltip>
				))}
			</div>
			<Group justify="space-between">
				<MantineText size="xs" c="dimmed">
					{days.length > 0 && formatDate(days[0].date)}
				</MantineText>
				<MantineText size="xs" c="dimmed">
					Today
				</MantineText>
			</Group>
		</figure>
	);
}
