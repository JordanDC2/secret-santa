import { Container, Title } from "@mantine/core";
import { useSelector } from "react-redux";
import type { RootState } from "Data/Redux/Store";

export default function DashboardPage() {
	const user = useSelector((state: RootState) => state.auth.user);

	return (
		<Container my={ 40 }>
			<Title>Welcome{ user ? `, ${ user.name }` : "" }</Title>
		</Container>
	);
}
