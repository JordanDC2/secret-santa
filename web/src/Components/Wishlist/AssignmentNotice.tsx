import { Fragment, type ReactNode } from "react";
import { Alert, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import type { IMyRecipient, IWishlistPerson } from "Components/Wishlist/types";

type IAssignmentNoticeProps = {
	owner: IWishlistPerson;
	myRecipients: IMyRecipient[];
};

/** Says whether this list belongs to the viewer's Secret Santa person, so nobody buys for the wrong one. */
/** "A", "A and B", "A, B and C" */
function joinNames(names: { key: string; node: ReactNode }[]) {
	return names.map(({ key, node }, index) => (
		<Fragment key={key}>
			{index > 0 && (index === names.length - 1 ? " and " : ", ")}
			{node}
		</Fragment>
	));
}

/**
 * Says whether this list belongs to one of the viewer's Secret Santa people, naming the
 * group each draw is in, so people in several groups (or drawing again next year) can't
 * mix up which exchange a gift is for.
 */
export default function AssignmentNotice({ owner, myRecipients }: IAssignmentNoticeProps) {
	if (myRecipients.length === 0) {
		return null;
	}

	const groupsWhereIDrewOwner = myRecipients.filter((recipient) => recipient.id === owner.id);

	if (groupsWhereIDrewOwner.length > 0) {
		return (
			<Alert color="green" title="🎅 This is your Secret Santa person!">
				You drew {owner.name} in{" "}
				{joinNames(
					groupsWhereIDrewOwner.map((recipient) => ({
						key: String(recipient.group.id),
						node: <strong>{recipient.group.name}</strong>,
					})),
				)}
				. Pick something from here and claim it so nobody else buys it too.
			</Alert>
		);
	}

	return (
		<Alert color="orange" title={`Heads up: ${owner.name} isn't your Secret Santa person`}>
			You&apos;re buying for{" "}
			{joinNames(
				myRecipients.map((recipient) => ({
					key: `${recipient.group.id}-${recipient.id}`,
					node: (
						<>
							<Anchor component={Link} to={`/wishlists/${recipient.id}`} fw={700}>
								{recipient.name}
							</Anchor>{" "}
							({recipient.group.name})
						</>
					),
				})),
			)}
			. You can still claim things here if you&apos;re getting {owner.name} a gift outside the exchange.
		</Alert>
	);
}
