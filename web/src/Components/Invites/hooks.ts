import { useQuery } from "@tanstack/react-query";
import type { IInvitePreview } from "Components/Invites/types";
import { apiClient } from "Data/Api/Client";

const PENDING_KEY = "pending-invite";

/** The address to share for a group: anyone opening it can sign up or log in and join. */
export function inviteLink(joinCode: string): string {
	return `${window.location.origin}/join/${joinCode}`;
}

export function useInvitePreviewQuery(code: string) {
	return useQuery({
		queryKey: ["invites", code],
		queryFn: async (): Promise<IInvitePreview> => {
			const preview = await apiClient.get<{
				group_name: string;
				owner_name: string;
				members_count: number;
				is_drawn: boolean;
				already_member: boolean;
			}>(`/invites/${encodeURIComponent(code)}`);

			return {
				groupName: preview.group_name,
				ownerName: preview.owner_name,
				membersCount: preview.members_count,
				isDrawn: preview.is_drawn,
				alreadyMember: preview.already_member,
			};
		},
		retry: false,
	});
}

/*
 * An invite opened while signed out is remembered for this tab (sessionStorage), so signing up
 * or logging in brings the visitor back to it. Closing the tab forgets it, so an old invite
 * can't surprise anyone weeks later.
 */
export function rememberPendingInvite(code: string) {
	try {
		sessionStorage.setItem(PENDING_KEY, code);
	} catch {
		// Storage blocked: they can open the link again after signing in.
	}
}

export function takePendingInvite(): string | null {
	try {
		const code = sessionStorage.getItem(PENDING_KEY);
		sessionStorage.removeItem(PENDING_KEY);

		return code;
	} catch {
		return null;
	}
}
