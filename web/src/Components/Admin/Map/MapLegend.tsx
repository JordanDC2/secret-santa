import { Group, Text as MantineText } from "@mantine/core";
import classes from "Components/Admin/Map/ChoroplethMap.module.less";

/** "Nobody · fewer → more", with the busiest place's count at the top end. */
export default function MapLegend({ most }: { most: number }) {
	return (
		<Group gap={6} wrap="wrap">
			<span className={classes.legend} data-step={0} />
			<MantineText size="xs" c="dimmed" mr="sm">
				Nobody
			</MantineText>
			<MantineText size="xs" c="dimmed">
				1
			</MantineText>
			{[1, 2, 3, 4].map((step) => (
				<span key={step} className={classes.legend} data-step={step} />
			))}
			<MantineText size="xs" c="dimmed">
				{most} {most === 1 ? "person" : "people"}
			</MantineText>
		</Group>
	);
}
