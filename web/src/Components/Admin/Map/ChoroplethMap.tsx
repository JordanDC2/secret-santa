import { Tooltip } from "@mantine/core";
import { geoPath, type GeoProjection } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import classes from "Components/Admin/Map/ChoroplethMap.module.less";

export type IMapFeature = Feature<Geometry, { name: string }> & { id?: string | number };

type IChoroplethMapProps = {
	features: IMapFeature[];
	/** Null for a map that's already projected (the US states file). */
	projection: GeoProjection | null;
	width: number;
	height: number;
	label: string;
	countFor: (feature: IMapFeature) => number;
	nameFor: (feature: IMapFeature) => string;
	/** The busiest place's count, so the shading is relative to it. */
	most: number;
};

/** Which of the four green steps a count gets (0 means nobody). */
export function shadeStep(count: number, most: number): 0 | 1 | 2 | 3 | 4 {
	if (count <= 0) {
		return 0;
	}

	return Math.max(1, Math.ceil((count / Math.max(1, most)) * 4)) as 1 | 2 | 3 | 4;
}

/**
 * Places shaded by how many people are there. Hover (or tab to) a shaded place for its name
 * and count; the table under the map lists the same numbers.
 */
export default function ChoroplethMap({
	features,
	projection,
	width,
	height,
	label,
	countFor,
	nameFor,
	most,
}: IChoroplethMapProps) {
	const path = geoPath(projection);

	return (
		<svg viewBox={`0 0 ${width} ${height}`} className={classes.map} role="img" aria-label={label}>
			{features.map((feature, index) => {
				const count = countFor(feature);
				const key = feature.id ?? index;
				const shape = { d: path(feature) ?? undefined, className: classes.place, "data-step": shadeStep(count, most) };

				// Only places with people are focusable and have a tooltip.
				return count > 0 ? (
					<Tooltip.Floating key={key} label={`${nameFor(feature)}: ${count}`}>
						<path {...shape} tabIndex={0} aria-label={`${nameFor(feature)}: ${count}`} />
					</Tooltip.Floating>
				) : (
					<path key={key} {...shape} />
				);
			})}
		</svg>
	);
}
