import { Text as MantineText } from "@mantine/core";

/** The app's one way to say something is still loading: a quiet line, e.g. "Loading your groups...". */
export default function LoadingText({ children }: { children: string }) {
	return <MantineText c="dimmed">{children}</MantineText>;
}
