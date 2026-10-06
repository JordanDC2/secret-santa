import type { ReactNode } from "react";
import { List, type MantineSize } from "@mantine/core";
import classes from "Components/Common/BulletList.module.less";

/** A bulleted list that stays inside narrow screens; use List.Item for each point. */
export default function BulletList({ size, children }: { size?: MantineSize; children: ReactNode }) {
	return (
		<List size={size} spacing="xs" withPadding classNames={{ item: classes.item }}>
			{children}
		</List>
	);
}
