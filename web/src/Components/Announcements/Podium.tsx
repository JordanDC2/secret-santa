import { Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import classes from "Components/Announcements/Podium.module.less";

export type IPodiumPlace = { name: string; value: string };

const PLACES = ["First", "Second", "Third"];

/**
 * The top three on a podium: first in the middle on the highest step, second to its left,
 * third to its right, each with a gold, silver or bronze trophy, their name and their result.
 */
export default function Podium({ title, places }: { title: string; places: IPodiumPlace[] }) {
	// Drawn left to right: second, first, third.
	const order = [1, 0, 2].filter((place) => places[place]);

	return (
		<section className={classes.podium} aria-label={title}>
			<MantineText className={classes.title}>{title}</MantineText>
			<ol className={classes.places}>
				{order.map((place) => (
					<li key={place} className={classes.place} data-place={place + 1} aria-label={`${PLACES[place]} place`}>
						<FontAwesomeIcon icon={faTrophy} className={classes.trophy} />
						<span className={classes.name}>{places[place].name}</span>
						<span className={classes.value}>{places[place].value}</span>
						<span className={classes.step}>{place + 1}</span>
					</li>
				))}
			</ol>
		</section>
	);
}
