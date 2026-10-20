import { useRef } from "react";
import { Stack, Text as MantineText } from "@mantine/core";
import GiftBoxIcon from "Components/Common/FestiveIcons/GiftBoxIcon";
import { useFullscreen } from "Components/ElfFling/useFullscreen";
import { useTouchScreen } from "Components/ElfFling/useTouchScreen";
import { useWakeLock } from "Components/ElfFling/useWakeLock";
import BackToGroups from "Components/Layout/BackToGroups";
import Page from "Components/Layout/Page";
import PageTitle from "Components/Layout/PageTitle";
import SilentNightGame from "Components/SilentNight/SilentNightGame";
import classes from "Components/SilentNight/SilentNight.module.less";

/**
 * Silent Night: the longest night of the year, and Krampus's horde has come for the North Pole.
 * Hold out until dawn. (Early days: the elf, its candy cane gun and the gingerbread men.)
 */
export default function SilentNightPage() {
	const stageRef = useRef<HTMLDivElement>(null);
	const { fullscreen, enter, exit } = useFullscreen(stageRef);
	const touchScreen = useTouchScreen();
	useWakeLock(fullscreen && touchScreen);

	return (
		<Page>
			<Stack gap="lg">
				<BackToGroups to="/games" label="Back to games" />
				<PageTitle icon={<GiftBoxIcon />}>Silent Night</PageTitle>
				<MantineText>
					The longest night of the year, and the gingerbread men have gone feral. Keep the elf alive in its ring of
					light until dawn.
				</MantineText>
				<div ref={stageRef} className={fullscreen ? `${classes.stage} ${classes.fullscreen}` : classes.stage}>
					<SilentNightGame fullscreen={fullscreen} onToggleFullscreen={fullscreen ? exit : enter} />
				</div>
				<MantineText size="sm" c="dimmed">
					{touchScreen
						? "Left thumb moves; right thumb aims and fires. Tap Dash to dart through them. Full screen, held sideways, is best."
						: "WASD or the arrow keys to move, the mouse to aim, hold the mouse button to fire. Space dashes through them; R reloads."}
				</MantineText>
			</Stack>
		</Page>
	);
}
