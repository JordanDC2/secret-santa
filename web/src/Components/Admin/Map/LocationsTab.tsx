import { Alert, Anchor, Stack, Table, Text as MantineText } from "@mantine/core";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopology from "world-atlas/countries-110m.json";
import statesTopology from "us-atlas/states-albers-10m.json";
import SectionCard from "Components/Common/SectionCard";
import LoadingText from "Components/Common/LoadingText";
import ChoroplethMap, { type IMapFeature } from "Components/Admin/Map/ChoroplethMap";
import MapLegend from "Components/Admin/Map/MapLegend";
import { NUMERIC_TO_ALPHA2 } from "Components/Admin/Map/countryCodes";
import { useAdminLocationsQuery } from "Components/Admin/hooks";
import type { IAdminLocations } from "Components/Admin/types";
import { apiErrorMessage } from "Data/Api/Client";

const WORLD_WIDTH = 960;
// us-atlas's "albers" file is already projected to this size, Alaska and Hawaii inset.
const US_SIZE = { width: 975, height: 610 };

function featuresOf(topology: unknown, object: string): IMapFeature[] {
	const typed = topology as Topology<Record<string, GeometryCollection<{ name: string }>>>;

	return (feature(typed, typed.objects[object]) as unknown as { features: IMapFeature[] }).features;
}

// Antarctica (010) would take a fifth of the map for nobody.
const COUNTRIES = featuresOf(worldTopology, "countries").filter((country) => country.id !== "010");
const STATES = featuresOf(statesTopology, "states");
const WORLD_COLLECTION = { type: "FeatureCollection" as const, features: COUNTRIES };
const WORLD_PROJECTION = geoNaturalEarth1().fitWidth(WORLD_WIDTH, WORLD_COLLECTION);
// As tall as the countries need at that width, so there's no empty band where Antarctica was.
const WORLD_SIZE = { width: WORLD_WIDTH, height: Math.ceil(geoPath(WORLD_PROJECTION).bounds(WORLD_COLLECTION)[1][1]) };

const countryNames = new Intl.DisplayNames(undefined, { type: "region" });

function countryName(code: string): string {
	return countryNames.of(code) ?? code;
}

/** Every country with people, busiest first, with its states or provinces under it. */
function LocationsTable({ locations }: { locations: IAdminLocations }) {
	return (
		<Table.ScrollContainer minWidth={280}>
			<Table striped>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Place</Table.Th>
						<Table.Th ta="right">Accounts</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{locations.countries.flatMap(({ country, count }) => [
						<Table.Tr key={country}>
							<Table.Td fw={700}>{countryName(country)}</Table.Td>
							<Table.Td ta="right">{count}</Table.Td>
						</Table.Tr>,
						...locations.regions
							.filter((region) => region.country === country)
							.map((region) => (
								<Table.Tr key={`${country}-${region.region}`}>
									<Table.Td pl="xl">{region.region}</Table.Td>
									<Table.Td ta="right">{region.count}</Table.Td>
								</Table.Tr>
							)),
					])}
				</Table.Tbody>
			</Table>
		</Table.ScrollContainer>
	);
}

/**
 * Where people use the app from: a world map by country and a US map by state, from a
 * free location file on the server (DB-IP). Counts only, never who; never towns.
 */
export default function LocationsTab() {
	const locations = useAdminLocationsQuery();

	if (locations.isPending) {
		return <LoadingText>Loading the map...</LoadingText>;
	}

	if (locations.isError) {
		return <Alert color="red">{apiErrorMessage(locations.error)}</Alert>;
	}

	const { countries, regions, unknown, dataBuiltAt } = locations.data;
	const byCountry = new Map(countries.map((row) => [row.country, row.count]));
	const usStates = new Map(regions.filter((row) => row.country === "US").map((row) => [row.region, row.count]));
	const mostInCountry = Math.max(0, ...countries.map((row) => row.count));
	const mostInState = Math.max(0, ...usStates.values());
	const placed = countries.reduce((sum, row) => sum + row.count, 0);

	return (
		<Stack gap="lg">
			<SectionCard title="Where people are">
				<ChoroplethMap
					features={COUNTRIES}
					projection={WORLD_PROJECTION}
					{...WORLD_SIZE}
					label={`World map of accounts by country: ${countries.map((row) => `${countryName(row.country)} ${row.count}`).join(", ") || "none yet"}`}
					countFor={(place) => byCountry.get(NUMERIC_TO_ALPHA2[String(place.id)] ?? "") ?? 0}
					nameFor={(place) => countryName(NUMERIC_TO_ALPHA2[String(place.id)] ?? "") || place.properties.name}
					most={mostInCountry}
				/>
				{mostInCountry > 0 && <MapLegend most={mostInCountry} />}
				<MantineText size="sm" c="dimmed">
					{placed} {placed === 1 ? "account" : "accounts"} on the map.
					{unknown > 0 &&
						` ${unknown} more ${unknown === 1 ? "hasn't" : "haven't"} been on since the map was added (or only from a home network that can't be placed).`}
				</MantineText>
			</SectionCard>
			{usStates.size > 0 && (
				<SectionCard title="United States">
					<ChoroplethMap
						features={STATES}
						projection={null}
						{...US_SIZE}
						label={`US map of accounts by state: ${[...usStates].map(([state, count]) => `${state} ${count}`).join(", ")}`}
						countFor={(place) => usStates.get(place.properties.name) ?? 0}
						nameFor={(place) => place.properties.name}
						most={mostInState}
					/>
					<MapLegend most={mostInState} />
				</SectionCard>
			)}
			{countries.length > 0 && (
				<SectionCard title="By place">
					<LocationsTable locations={locations.data} />
				</SectionCard>
			)}
			<MantineText size="xs" c="dimmed">
				Locations are worked out on this server from each person&apos;s internet address, at most once a day, using{" "}
				<Anchor href="https://db-ip.com" target="_blank" rel="noreferrer" size="xs">
					IP Geolocation by DB-IP
				</Anchor>
				{dataBuiltAt &&
					` (${new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(dataBuiltAt))})`}
				. Only the country and state or province are kept.
			</MantineText>
		</Stack>
	);
}
