import { Button, Group, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import SectionCard from "Components/Common/SectionCard";

/** Only for the site's owner: a quick way to the admin page (the only way on phones, where the header has no room). */
export default function AdminSection() {
	return (
		<SectionCard title="Admin">
			<MantineText size="sm">Site stats and health, and everyone&apos;s accounts and groups.</MantineText>
			<Group justify="flex-end">
				<Button component={Link} to="/admin" variant="secondary">
					Open the admin page
				</Button>
			</Group>
		</SectionCard>
	);
}
