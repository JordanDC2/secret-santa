import {
	Group,
	SegmentedControl,
	Text as MantineText,
	useMantineColorScheme,
	type MantineColorScheme,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleHalfStroke, faMoon, faSun, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";

const OPTIONS: { value: MantineColorScheme; label: string; icon: IconDefinition }[] = [
	{ value: "auto", label: "System", icon: faCircleHalfStroke },
	{ value: "light", label: "Light", icon: faSun },
	{ value: "dark", label: "Dark", icon: faMoon },
];

/** Light, dark, or whatever the phone or computer is set to. Remembered on this device only. */
export default function AppearanceSection() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	return (
		<SectionCard title="Appearance">
			<SegmentedControl
				fullWidth
				aria-label="Theme"
				value={colorScheme}
				onChange={(value) => setColorScheme(value as MantineColorScheme)}
				data={OPTIONS.map(({ value, label, icon }) => ({
					value,
					label: (
						<Group gap={8} justify="center" wrap="nowrap">
							<FontAwesomeIcon icon={icon} />
							<span>{label}</span>
						</Group>
					),
				}))}
			/>
			<MantineText size="sm" c="dimmed">
				System follows your phone or computer&apos;s setting. Saved on this device only.
			</MantineText>
		</SectionCard>
	);
}
