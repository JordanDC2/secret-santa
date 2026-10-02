import { Fragment } from "react";
import { Alert, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import type { IWishlistPerson } from "Components/Wishlist/types";

type IAssignmentNoticeProps = {
	owner: IWishlistPerson;
	myRecipients: IWishlistPerson[];
};

/** Says whether this list belongs to the viewer's Secret Santa person, so nobody buys for the wrong one. */
export default function AssignmentNotice({ owner, myRecipients }: IAssignmentNoticeProps) {
	if (myRecipients.length === 0) {
		return null;
	}

	if (myRecipients.some((recipient) => recipient.id === owner.id)) {
		return (
			<Alert color="green" title="🎅 This is your Secret Santa person!">
				You drew {owner.name}. Pick something from here and claim it so nobody else buys it too.
			</Alert>
		);
	}

	return (
		<Alert color="orange" title={`Heads up: ${owner.name} isn't your Secret Santa person`}>
			You&apos;re buying for{" "}
			{myRecipients.map((recipient, index) => (
				<Fragment key={recipient.id}>
					{index > 0 && (index === myRecipients.length - 1 ? " and " : ", ")}
					<Anchor component={Link} to={`/wishlists/${recipient.id}`} fw={700}>
						{recipient.name}
					</Anchor>
				</Fragment>
			))}
			. You can still claim things here if you&apos;re getting {owner.name} a gift outside the exchange.
		</Alert>
	);
}
