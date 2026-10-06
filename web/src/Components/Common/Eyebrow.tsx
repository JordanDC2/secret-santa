import type { ReactNode } from "react";
import { Text as MantineText } from "@mantine/core";
import classes from "Components/Common/Eyebrow.module.less";

/** A small uppercase label above a block, e.g. "GROUP NOTE" or "YOU'RE THE SECRET SANTA FOR". */
export default function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<MantineText
			size="xs"
			fw={700}
			tt="uppercase"
			c="dimmed"
			className={[classes.eyebrow, className].filter(Boolean).join(" ")}
		>
			{children}
		</MantineText>
	);
}
