import { Anchor, Group, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import type { IGroup } from "Components/Groups/types";

type IGroupMembersProps = {
	members: IGroup["members"];
};

/** Each member's name links to their wishlist. */
export default function GroupMembers({ members }: IGroupMembersProps) {
	const { user } = useAuth();

	return (
		<Group gap="xs" mt="xs">
			<MantineText size="sm">Wishlists:</MantineText>
			{members.map((member) => (
				<Anchor
					key={member.id}
					component={Link}
					to={member.id === user?.id ? "/wishlist" : `/wishlists/${member.id}`}
					size="sm"
				>
					{member.id === user?.id ? "You" : member.name}
				</Anchor>
			))}
		</Group>
	);
}
