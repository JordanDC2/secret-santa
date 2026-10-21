import { useRef } from "react";
import { Alert, Stack, Text as MantineText } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import { useFullscreen } from "Components/ElfFling/useFullscreen";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import { useWakeLock } from "Components/ElfFling/useWakeLock";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import LoadingText from "Components/Common/LoadingText";
import {
	useBuyMutation,
	useChooseCharacterMutation,
	useProgressQuery,
	useRecordRunMutation,
} from "Components/SilentNight/hooks";
import SilentNightGame from "Components/SilentNight/SilentNightGame";
import SilentNightLeaderboard from "Components/SilentNight/SilentNightLeaderboard";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/SilentNight/SilentNight.module.less";

/**
 * Silent Night: the longest night of the year, and Krampus's horde has come. Hold out until
 * dawn, with the patrons' blessings (and, if you dare, Krampus's bargains), and beat him when he
 * comes for you himself. Each night is kept for the leaderboards and earns coal, spent in the
 * Coal Cellar (in the game's menu) on upgrades and the rest of the cast.
 */
export default function SilentNightPage() {
	const { user } = useAuth();

	// Admins only while it's being finished.
	if (!user) {
		return null;
	}

	if (!user.isAdmin) {
		return <Navigate to="/games" replace />;
	}

	return <SilentNight />;
}

function SilentNight() {
	const stageRef = useRef<HTMLDivElement>(null);
	const { fullscreen, enter, exit } = useFullscreen(stageRef, "landscape", true);
	const touchScreen = useTouchScreen();
	useWakeLock(fullscreen && touchScreen);
	const progressQuery = useProgressQuery();
	const recordRun = useRecordRunMutation();
	const buy = useBuyMutation();
	const choose = useChooseCharacterMutation();
	const menuError = buy.error ?? choose.error;

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups to="/games" label="Back to games" />
				<PageTitle icon={<GiftBoxIcon />}>Silent Night</PageTitle>
				<MantineText>
					The longest night of the year, and Krampus&apos;s horde has come out of the dark. Stay alive in your ring of
					light until dawn, when Krampus comes for you himself. Patrons from Christmases around the world will bless you
					at their shrines; Krampus will offer you bargains at his altars. Every night earns coal for the Coal Cellar.
				</MantineText>
				{progressQuery.isPending && <LoadingText>Loading Silent Night...</LoadingText>}
				{progressQuery.isError && <Alert color="red">{apiErrorMessage(progressQuery.error)}</Alert>}
				{progressQuery.data && (
					<div ref={stageRef} className={fullscreen ? `${classes.stage} ${classes.fullscreen}` : classes.stage}>
						<SilentNightGame
							fullscreen={fullscreen}
							onToggleFullscreen={fullscreen ? exit : enter}
							progress={progressQuery.data}
							busy={buy.isPending || choose.isPending}
							error={menuError ? apiErrorMessage(menuError) : null}
							onBuy={(purchase) => {
								choose.reset();
								buy.mutate(purchase);
							}}
							onChoose={(character) => {
								buy.reset();
								choose.mutate(character);
							}}
							onNightOver={(run) => recordRun.mutate(run)}
							coalEarned={recordRun.isPending ? null : (recordRun.data?.coal_earned ?? null)}
						/>
					</div>
				)}
				{recordRun.isError && (
					<Alert color="red">Your night couldn&apos;t be saved: {apiErrorMessage(recordRun.error)}</Alert>
				)}
				<MantineText size="sm" c="dimmed">
					{touchScreen
						? "Left thumb moves; right thumb aims and fires. Tap Dash to dart through them. Everything else fires on its own. Full screen, held sideways, is best."
						: "WASD or the arrow keys to move, the mouse to aim, hold the mouse button to fire. Space dashes through them; R reloads; Esc pauses. Everything else fires on its own."}
				</MantineText>
				<SilentNightLeaderboard />
			</Stack>
		</Page>
	);
}
