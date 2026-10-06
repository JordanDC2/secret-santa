import { Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import classes from "Components/Common/AddChip.module.less";

type IAddChipProps = {
	onClick: () => void;
	/** What it adds, e.g. "Add note". */
	children: string;
};

/** A small, quiet "+ Add …" chip for something a group doesn't have yet. */
export default function AddChip({ onClick, children }: IAddChipProps) {
	return (
		<Badge
			component="button"
			type="button"
			variant="light"
			color="gray"
			tt="none"
			leftSection={<FontAwesomeIcon icon={faPlus} />}
			className={classes.chip}
			onClick={onClick}
		>
			{children}
		</Badge>
	);
}
