import { useMemo } from "react";
import classes from "Components/Layout/Snowfall.module.less";

const SNOWFLAKE_COUNT = 40;

function randomBetween(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

export default function Snowfall() {
	const snowflakes = useMemo(() => Array.from({ length: SNOWFLAKE_COUNT }, (_, index) => ({
		id: index,
		left: randomBetween(0, 100),
		duration: randomBetween(8, 18),
		delay: randomBetween(0, 10),
		size: randomBetween(0.6, 1.6)
	})), []);

	return (
		<div className={ classes.snowfall } aria-hidden="true">
			{ snowflakes.map((flake) => (
				<span
					key={ flake.id }
					className={ classes.snowflake }
					style={ {
						left: `${ flake.left }%`,
						animationDuration: `${ flake.duration }s`,
						animationDelay: `${ flake.delay }s`,
						fontSize: `${ flake.size }rem`
					} }
				>
					❄
				</span>
			)) }
		</div>
	);
}
