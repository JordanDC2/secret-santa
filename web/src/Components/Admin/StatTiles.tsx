import { Paper, SimpleGrid, Text as MantineText } from "@mantine/core";
import type { IAdminCounts } from "Components/Admin/types";
import classes from "Components/Admin/StatTiles.module.less";

const TILES: { key: keyof IAdminCounts; label: string }[] = [
	{ key: "accounts", label: "Accounts" },
	{ key: "kidsAndPets", label: "Kids & pets" },
	{ key: "groups", label: "Groups" },
	{ key: "drawnGroups", label: "Drawn groups" },
	{ key: "wishlistItems", label: "Wishlist items" },
	{ key: "santaMessages", label: "Santa chat messages" },
];

/** The site's size at a glance: a big number with its label under it. */
export default function StatTiles({ counts }: { counts: IAdminCounts }) {
	return (
		<SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
			{TILES.map(({ key, label }) => (
				<Paper key={key} withBorder radius="md" p="md">
					<MantineText className={classes.value}>{counts[key].toLocaleString()}</MantineText>
					<MantineText size="sm" c="dimmed">
						{label}
					</MantineText>
				</Paper>
			))}
		</SimpleGrid>
	);
}
