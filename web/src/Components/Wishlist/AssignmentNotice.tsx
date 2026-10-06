import { Fragment, type ReactNode } from "react";
import { Alert, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import GiftTagIcon from "Components/Common/FestiveIcons/GiftTagIcon";
import { formatExchangeDate } from "Components/Groups/exchange";
import type { IMemberWishlist, IMyRecipient } from "Components/Wishlist/types";
import classes from "Components/Wishlist/AssignmentNotice.module.less";

type IAssignmentNoticeProps = {
	owner: IMemberWishlist["user"];
	myRecipients: IMyRecipient[];
};

/** "A", "A and B", "A, B and C" */
function joinNames(names: { key: string; node: ReactNode }[]) {
	return names.map(({ key, node }, index) => (
		<Fragment key={key}>
			{index > 0 && (index === names.length - 1 ? " and " : ", ")}
			{node}
		</Fragment>
	));
}

/** "Exchange Sun, Dec 20 · Budget $30–$50", or whichever half the group's owner set. */
function exchangeDetails(group: IMyRecipient["group"]): string | null {
	const parts = [
		group.exchangeDate && `Exchange ${formatExchangeDate(group.exchangeDate)}`,
		group.budget && `Budget ${group.budget}`,
	].filter(Boolean);

	return parts.length > 0 ? parts.join(" · ") : null;
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
			<Alert
				color="green"
				icon={<GiftTagIcon size={34} />}
				classNames={{ icon: classes.tagIcon }}
				title={
					groupsWhereIDrewOwner.every((recipient) => recipient.santaName)
						? `This is ${groupsWhereIDrewOwner[0].santaName}'s Secret Santa person!`
						: "This is your Secret Santa person!"
				}
			>
				{joinNames(
					groupsWhereIDrewOwner.map((recipient) => ({
						key: `${recipient.group.id}-${recipient.santaName ?? "you"}`,
						node: (
							<>
								{recipient.santaName ?? "You"} drew {owner.name} in <strong>{recipient.group.name}</strong>
							</>
						),
					})),
				)}
				.
				{groupsWhereIDrewOwner.map(({ group }) => {
					const details = exchangeDetails(group);

					return details ? (
						<div key={group.id} className={classes.details}>
							{groupsWhereIDrewOwner.length > 1 && <strong>{group.name}: </strong>}
							{details}
						</div>
					) : null;
				})}
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
							({recipient.santaName ? `for ${recipient.santaName}, ` : ""}
							{recipient.group.name})
						</>
					),
				})),
			)}
			. You can still claim things here if you&apos;re getting {owner.firstName} a gift outside the exchange.
		</Alert>
	);
}
