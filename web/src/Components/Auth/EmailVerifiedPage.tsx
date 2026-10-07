import { useEffect } from "react";
import { Alert, Button, Stack } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { CURRENT_USER_QUERY_KEY, useAuth } from "Components/Auth/AuthContext";
import AuthLayout from "Components/Layout/AuthLayout";

/**
 * Where the "Confirm my email" link ends up (the API checks it, then sends people here). Works
 * signed in or out, since people often open the email on a phone that isn't signed in.
 */
export default function EmailVerifiedPage() {
	const [searchParams] = useSearchParams();
	const confirmed = searchParams.get("status") === "confirmed";
	const { status } = useAuth();
	const queryClient = useQueryClient();
	const signedIn = status === "authenticated";

	// If they're signed in here, pick up the change so the banner goes away.
	useEffect(() => {
		if (confirmed) {
			void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
		}
	}, [confirmed, queryClient]);

	return (
		<AuthLayout subtitle={confirmed ? "Thanks! The elves have your address." : "Hmm, that link didn't work."}>
			<Stack>
				{confirmed ? (
					<Alert color="green" title="Email confirmed">
						Your assignment and messages will reach your inbox.
					</Alert>
				) : (
					<Alert color="orange" title="That link has expired">
						Links work for a day, and stop working if the email address changes. {signedIn ? "Use" : "Log in and use"}{" "}
						&quot;Send it again&quot; at the top of the page for a fresh one.
					</Alert>
				)}
				<Button component={Link} to={signedIn ? "/" : "/login"}>
					{signedIn ? "Go to your groups" : "Log in"}
				</Button>
			</Stack>
		</AuthLayout>
	);
}
