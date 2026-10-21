import { useState } from "react";
import { Alert, Button, SimpleGrid, Stack, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import ConfirmButtons from "Components/Common/ConfirmButtons";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import { useProgressQuery, useUnlockPinballMutation } from "Components/ElfFling/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import SectionCard from "Components/Common/SectionCard";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";

/** Little festive games, for a bit of fun while waiting for the exchange. */
export default function GamesPage() {
	// Pinball is found down a chimney in Elf Fling before it can be played (or even named) here.
	const pinballUnlocked = useProgressQuery().data?.pinballUnlocked ?? false;
	const isAdmin = useAuth().user?.isAdmin ?? false;

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
					{/* Admins only while it's being finished. */}
					{isAdmin && (
						<SectionCard
							title="Silent Night"
							action={
								<Button component={Link} to="/games/silent-night" variant="secondary" size="xs">
									Play
								</Button>
							}
						>
							<MantineText size="sm">
								Survive the longest night of the year against Krampus&apos;s horde, blessed by patrons from Christmases
								around the world, until he comes for you at dawn.
							</MantineText>
							<MantineText size="xs" c="dimmed">
								Only admins can see this for now.
							</MantineText>
						</SectionCard>
					)}
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
								Elf Fling&apos;s secret level: a whole Christmas pinball machine, with ramps, chimneys, missions and
								multiball.
							</MantineText>
						</SectionCard>
					) : (
						<LockedGame />
					)}
				</SimpleGrid>
			</Stack>
		</Page>
	);
}

/**
 * The secret game's card until it's found: play Elf Fling to find it, or (for anyone who won't
 * play enough to get there) unlock it anyway, after an "are you sure?".
 */
function LockedGame() {
	const [asking, setAsking] = useState(false);
	const unlock = useUnlockPinballMutation();

	return (
		<SectionCard
			title="?"
			action={
				<Button component={Link} to="/games/elf-fling" variant="secondary" size="xs">
					Play Elf Fling
				</Button>
			}
		>
			<MantineText size="sm">Play Elf Fling to unlock.</MantineText>
			{asking ? (
				<Stack gap="xs">
					<MantineText size="sm">Unlock it now? You&apos;ll miss finding it yourself in Elf Fling.</MantineText>
					{unlock.isError && <Alert color="red">{apiErrorMessage(unlock.error)}</Alert>}
					<ConfirmButtons
						size="xs"
						confirmLabel="Unlock it"
						isPending={unlock.isPending}
						onConfirm={() => unlock.mutate()}
						onCancel={() => setAsking(false)}
					/>
				</Stack>
			) : (
				<Button variant="subtle" size="xs" w="fit-content" onClick={() => setAsking(true)}>
					Unlock anyway
				</Button>
			)}
		</SectionCard>
	);
}
