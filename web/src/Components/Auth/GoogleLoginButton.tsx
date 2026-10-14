import { useEffect, useRef, useState } from "react";
import { Alert, Box, Divider, Stack, useComputedColorScheme } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useAuth } from "Components/Auth/AuthContext";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity, setGoogleCredentialHandler } from "Components/Auth/googleIdentity";
import { apiErrorMessage } from "Data/Api/Client";

/** Google draws its button between these widths. */
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/**
 * "Continue with Google" above the email form, on the log in and create account pages. Logs in,
 * or creates the account on first use. Hidden when the site has no Google client id, or if
 * Google's script can't load (the email form still works).
 */
export default function GoogleLoginButton() {
	const { googleLogin } = useAuth();
	const colorScheme = useComputedColorScheme("light");
	const { ref: sizeRef, width } = useElementSize();
	const buttonRef = useRef<HTMLDivElement>(null);
	const [unavailable, setUnavailable] = useState(false);
	const logInWithGoogle = googleLogin.mutate;

	useEffect(() => {
		setGoogleCredentialHandler((credential) => logInWithGoogle(credential));

		return () => setGoogleCredentialHandler(null);
	}, [logInWithGoogle]);

	useEffect(() => {
		const target = buttonRef.current;

		if (!GOOGLE_CLIENT_ID || !target || width === 0) {
			return;
		}

		let cancelled = false;
		loadGoogleIdentity()
			.then((identity) => {
				if (cancelled) {
					return;
				}

				// Redrawn when the card's width or the colour scheme changes.
				target.replaceChildren();
				identity.renderButton(target, {
					type: "standard",
					theme: colorScheme === "dark" ? "filled_black" : "outline",
					size: "large",
					text: "continue_with",
					shape: "pill",
					logo_alignment: "center",
					width: Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))),
				});
			})
			.catch(() => setUnavailable(true));

		return () => {
			cancelled = true;
		};
	}, [width, colorScheme]);

	if (!GOOGLE_CLIENT_ID || unavailable) {
		return null;
	}

	return (
		<Stack gap="md" mb="md">
			{googleLogin.isError && <Alert color="red">{apiErrorMessage(googleLogin.error)}</Alert>}
			<Box ref={sizeRef}>
				{/* Google's button sits in its own frame, 44px tall; holding the space stops the card jumping. */}
				<Box
					ref={buttonRef}
					mih={44}
					display="flex"
					// Google's frame is a light page, so place it as light: in dark mode the browser
					// would otherwise paint a white box behind it.
					style={{ justifyContent: "center", colorScheme: "light" }}
					aria-busy={googleLogin.isPending}
				/>
			</Box>
			<Divider label="or use your email" labelPosition="center" />
		</Stack>
	);
}
