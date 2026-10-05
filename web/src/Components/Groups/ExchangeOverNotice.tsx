import { Anchor, Text as MantineText } from "@mantine/core";
import { formatExchangeDate } from "Components/Groups/exchange";
import type { IGroup } from "Components/Groups/types";

type IExchangeOverNoticeProps = {
	group: IGroup & { exchangeDate: string };
	/** Owner-only: opens the "are you sure?" panel for a new draw. */
	onStartNewDraw: () => void;
	/** Owner-only: opens the date & budget form. */
	onSetDate: () => void;
};

/**
 * Once the exchange day has passed: a word that it's over, and for the owner, the next step as
 * a link in the sentence (start a new draw, or once they have, set the next date). Both are in
 * the card's ⋯ menu too.
 */
export default function ExchangeOverNotice({ group, onStartNewDraw, onSetDate }: IExchangeOverNoticeProps) {
	if (!group.isDrawn) {
		return group.isOwner ? (
			<MantineText size="sm" c="dimmed">
				Ready for the next one?{" "}
				<Anchor component="button" type="button" size="sm" onClick={onSetDate}>
					Set the next exchange date
				</Anchor>{" "}
				before you draw names.
			</MantineText>
		) : null;
	}

	return (
		<MantineText size="sm" c="dimmed">
			The {formatExchangeDate(group.exchangeDate)} exchange is over. Hope the gifts were a hit!{" "}
			{group.isOwner ? (
				<>
					When you&apos;re ready for the next one,{" "}
					<Anchor component="button" type="button" size="sm" onClick={onStartNewDraw}>
						start a new draw
					</Anchor>
					.
				</>
			) : (
				"The group owner can start a new draw for next time."
			)}
		</MantineText>
	);
}
