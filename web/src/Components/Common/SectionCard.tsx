import type { ReactNode } from "react";
import { Card, Group, Stack, Title } from "@mantine/core";
import classes from "Components/Common/SectionCard.module.less";

type ISectionCardProps = {
	title: ReactNode;
	/** Shown before the title, e.g. a festive illustration. */
	icon?: ReactNode;
	/** A button on the right of the heading, e.g. "Add kid or pet". */
	action?: ReactNode;
	/** For irreversible things like deleting an account: red heading and border. */
	danger?: boolean;
	children: ReactNode;
};

/**
 * One titled card on a page (the Settings sections, "Create a group"...). The heading is a
 * level 2 under the page's title, sized like the rest of the app's card headings.
 */
export default function SectionCard({ title, icon, action, danger = false, children }: ISectionCardProps) {
	return (
		<Card component="section" withBorder padding="lg" radius="md" className={danger ? classes.danger : undefined}>
			<Stack gap="md">
				<Group justify="space-between" wrap="nowrap" gap="sm">
					<Title order={2} size="h4" className={classes.title} c={danger ? "red" : undefined}>
						{icon}
						{title}
					</Title>
					{action}
				</Group>
				{children}
			</Stack>
		</Card>
	);
}
