import { Button, SimpleGrid, Stack, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import { useProgressQuery } from "Components/ElfFling/hooks";
import SectionCard from "Components/Common/SectionCard";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";

/** Little festive games, for a bit of fun while waiting for the exchange. */
export default function GamesPage() {
	// Pinball is found down a chimney in Elf Fling before it can be played (or even named) here.
	const pinballUnlocked = useProgressQuery().data?.pinballUnlocked ?? false;

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
					{/* Kept a mystery until it's found down a chimney in Elf Fling. */}
					{pinballUnlocked ? (
						<SectionCard
							title="Christmas pinball"
							action={
								<Button component={Link} to="/games/pinball" variant="secondary" size="xs">
									Play
								</Button>
							}
						>
							<MantineText size="sm">
								Elf Fling&apos;s secret level: candy-cane flippers, ornament bumpers and gifts to light up.
							</MantineText>
						</SectionCard>
					) : (
						<SectionCard
							title="?"
							action={
								<Button component={Link} to="/games/elf-fling" variant="secondary" size="xs">
									Play Elf Fling
								</Button>
							}
						>
							<MantineText size="sm">Play Elf Fling to unlock.</MantineText>
						</SectionCard>
					)}
				</SimpleGrid>
			</Stack>
		</Page>
	);
}
