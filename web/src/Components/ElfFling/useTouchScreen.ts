import { useMediaQuery } from "@mantine/hooks";

/**
 * Whether this is a touch screen with no mouse (a phone or tablet), so the game talks about
 * tapping and leaves out keyboard shortcuts nobody there can press.
 */
export function useTouchScreen(): boolean {
	return useMediaQuery("(hover: none) and (pointer: coarse)") ?? false;
}
