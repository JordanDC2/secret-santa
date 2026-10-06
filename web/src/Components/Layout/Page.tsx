import type { ReactNode } from "react";
import { Container, type MantineSize } from "@mantine/core";

/** The main content of a signed-in page, below the header. Narrow ("sm") for form pages like Settings. */
export default function Page({ size, children }: { size?: MantineSize; children: ReactNode }) {
	return (
		// Full width: inside the layout's flex column, a Container would otherwise shrink to its content.
		<Container component="main" size={size} my={40} w="100%">
			{children}
		</Container>
	);
}
