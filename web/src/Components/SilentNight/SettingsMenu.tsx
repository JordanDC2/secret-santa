import { useEffect, type CSSProperties } from "react";
import GameButton from "Components/SilentNight/GameButton";
import type { ISettings } from "Components/SilentNight/settings";
import { playSelect } from "Components/SilentNight/sound";
import classes from "Components/SilentNight/SilentNight.module.less";

type ISettingsMenuProps = {
	settings: ISettings;
	onChange: (settings: ISettings) => void;
	onClose: () => void;
};

/**
 * The game's settings, over whatever's showing (the main menu or the pause menu): aiming and
 * shooting for you, and the music's and the sound effects' volumes. Escape closes it (and only
 * it, so a paused night stays paused).
 */
export default function SettingsMenu({ settings, onChange, onClose }: ISettingsMenuProps) {
	useEffect(() => {
		// Before the game's own keys (which would carry on a paused night).
		const down = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.stopImmediatePropagation();
				onClose();
			}
		};
		window.addEventListener("keydown", down, true);

		return () => window.removeEventListener("keydown", down, true);
	}, [onClose]);

	const toggle = (key: "autoAim" | "autoShoot", label: string, help: string) => (
		<label className={classes.setting}>
			<span className={classes.settingName}>
				{label}
				<span className={classes.dim}>{help}</span>
			</span>
			<input
				type="checkbox"
				className={classes.switch}
				checked={settings[key]}
				onChange={(event) => {
					playSelect();
					onChange({ ...settings, [key]: event.currentTarget.checked });
				}}
			/>
		</label>
	);

	const volume = (key: "music" | "effects", label: string) => (
		<label className={classes.setting}>
			<span className={classes.settingName}>{label}</span>
			<input
				type="range"
				className={classes.slider}
				min={0}
				max={100}
				step={5}
				value={Math.round(settings[key] * 100)}
				style={{ "--fill": `${settings[key] * 100}%` } as CSSProperties}
				aria-valuetext={`${Math.round(settings[key] * 100)}%`}
				onChange={(event) => onChange({ ...settings, [key]: Number(event.currentTarget.value) / 100 })}
				// A tick at the new loudness, to hear it by.
				onPointerUp={key === "effects" ? playSelect : undefined}
				onKeyUp={key === "effects" ? playSelect : undefined}
			/>
		</label>
	);

	return (
		<div className={`${classes.overlay} ${classes.settings}`}>
			<p className={classes.title}>Settings</p>
			<div className={classes.settingList}>
				{toggle(
					"autoAim",
					"Auto-aim",
					"The gun always aims at the nearest enemy. On a touch screen, a fire button replaces aiming.",
				)}
				{toggle("autoShoot", "Auto-shoot", "The gun fires by itself whenever an enemy's in reach.")}
				{volume("music", "Music")}
				{volume("effects", "Sound effects")}
			</div>
			<GameButton onClick={onClose}>Done</GameButton>
		</div>
	);
}
