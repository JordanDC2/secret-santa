import { useEffect, useRef } from "react";
import { Alert, Button, Stack, Text as MantineText } from "@mantine/core";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "Components/Auth/AuthContext";
import { useJoinGroupMutation } from "Components/Groups/hooks";
import { rememberPendingInvite, useInvitePreviewQuery } from "Components/Invites/hooks";
import type { IInviteNotice } from "Components/Invites/types";
import AuthLayout from "Components/Layout/AuthLayout";
import { apiErrorMessage } from "Data/Api/Client";

/**
 * Where an invite link (/join/CODE) lands. Signed in: joins straight away and goes to the
 * dashboard. Signed out: says which group it is and offers sign-up or log-in, remembering the
 * invite so they come back here and join once they're in.
 */
export default function JoinInvitePage() {
	const code = useParams().code ?? "";
	const { status } = useAuth();
	const previewQuery = useInvitePreviewQuery(code);
	const joinGroup = useJoinGroupMutation();
	const navigate = useNavigate();
	const joinStarted = useRef(false);
	const preview = previewQuery.data;
	const signedIn = status === "authenticated";

	// Join once the group is known, for someone signed in who can join it.
	useEffect(() => {
		if (!signedIn || !preview || joinStarted.current) {
			return;
		}

		if (preview.alreadyMember) {
			joinStarted.current = true;
			navigate("/", {
				replace: true,
				state: { inviteNotice: `You're already in ${preview.groupName}.` } satisfies IInviteNotice,
			});
		} else if (!preview.isDrawn) {
			joinStarted.current = true;
			joinGroup.mutate(
				{ joinCode: code },
				{
					onSuccess: () =>
						navigate("/", {
							replace: true,
							state: {
								inviteNotice: `You joined ${preview.groupName}! Add a few things to your wishlist.`,
							} satisfies IInviteNotice,
						}),
				},
			);
		}
	}, [signedIn, preview, code, joinGroup, navigate]);

	if (!code) {
		return <Navigate to="/" replace />;
	}

	if (previewQuery.isPending || status === "loading") {
		return (
			<AuthLayout subtitle="Checking your invite...">
				<MantineText ta="center">One moment...</MantineText>
			</AuthLayout>
		);
	}

	if (previewQuery.isError || !preview) {
		return (
			<AuthLayout subtitle="Hmm, that invite didn't work.">
				<Stack>
					<Alert color="red">{apiErrorMessage(previewQuery.error)}</Alert>
					<Button component={Link} to="/" variant="secondary">
						Go to Secret Santa
					</Button>
				</Stack>
			</AuthLayout>
		);
	}

	if (preview.isDrawn && !preview.alreadyMember) {
		return (
			<AuthLayout subtitle={`You're invited to ${preview.groupName}`}>
				<Stack>
					<Alert color="orange">
						Names have already been drawn for {preview.groupName}, so it isn&apos;t taking new members. Ask{" "}
						{preview.ownerName} about the next draw.
					</Alert>
					<Button component={Link} to="/" variant="secondary">
						Go to Secret Santa
					</Button>
				</Stack>
			</AuthLayout>
		);
	}

	if (signedIn) {
		return (
			<AuthLayout subtitle={`Joining ${preview.groupName}...`}>
				{joinGroup.isError ? (
					<Stack>
						<Alert color="red">{apiErrorMessage(joinGroup.error)}</Alert>
						<Button component={Link} to="/" variant="secondary">
							Go to your groups
						</Button>
					</Stack>
				) : (
					<MantineText ta="center">Adding you to the group...</MantineText>
				)}
			</AuthLayout>
		);
	}

	return (
		<AuthLayout subtitle="Ho ho ho! You've been invited.">
			<Stack>
				<MantineText ta="center" size="lg">
					{preview.ownerName} invited you to join <strong>{preview.groupName}</strong>
				</MantineText>
				<MantineText ta="center" size="sm" c="dimmed">
					{preview.membersCount} {preview.membersCount === 1 ? "person is" : "people are"} in it so far. Create an
					account or log in, and you&apos;ll join it straight away.
				</MantineText>
				<Button component={Link} to="/register" onClick={() => rememberPendingInvite(code)}>
					Create account
				</Button>
				<Button component={Link} to="/login" variant="secondary" onClick={() => rememberPendingInvite(code)}>
					I already have an account
				</Button>
			</Stack>
		</AuthLayout>
	);
}
