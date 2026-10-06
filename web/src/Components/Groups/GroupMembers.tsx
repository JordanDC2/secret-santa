import { Anchor, Badge, Group, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChild, faPaw } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import type { IGroup, IGroupMember } from "Components/Groups/types";
import classes from "Components/Groups/GroupCard.module.less";

type IGroupMembersProps = {
	members: IGroup["members"];
	/** Shown to members who look after kids or pets, before the draw. */
	onManageKids?: () => void;
};

/** Your own list and your kids' and pets' open where you keep them; everyone else's shows as a shopper sees it. */
function wishlistPath(member: IGroupMember, myId: number | undefined) {
	if (member.id === myId) {
		return "/wishlist";
	}

	return member.managedByMe ? `/wishlist?for=${member.id}` : `/wishlists/${member.id}`;
}

/** Each member's name links to their wishlist; kids and pets are marked. */
export default function GroupMembers({ members, onManageKids }: IGroupMembersProps) {
	const { user } = useAuth();

	return (
		<Group gap="xs" mt="xs">
			<MantineText size="sm">Wishlists:</MantineText>
			{members.map((member) => (
				<Anchor key={member.id} component={Link} to={wishlistPath(member, user?.id)} size="sm">
					{member.kind && <FontAwesomeIcon icon={member.kind === "pet" ? faPaw : faChild} />}{" "}
					{member.id === user?.id ? "You" : member.name}
				</Anchor>
			))}
			{onManageKids && (
				<Badge
					component="button"
					type="button"
					variant="light"
					color="gray"
					tt="none"
					className={classes.addChip}
					onClick={onManageKids}
				>
					+ Kids &amp; pets
				</Badge>
			)}
		</Group>
	);
}
