import { Button, SimpleGrid, Stack, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import SectionCard from "Components/Common/SectionCard";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";

/** Little festive games, for a bit of fun while waiting for the exchange. */
export default function GamesPage() {
	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups />
				<PageTitle icon={<GiftBoxIcon />}>Games</PageTitle>
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<SectionCard
						title="Elf Fling"
						action={
							<Button component={Link} to="/games/elf-fling" variant="secondary" size="xs">
								Play
							</Button>
						}
					>
						<MantineText size="sm">
							Help a reindeer bat a little elf as far as it can fly. Time the swing for the sweet spot.
						</MantineText>
					</SectionCard>
				</SimpleGrid>
			</Stack>
		</Page>
	);
}
