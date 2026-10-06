import { useState } from "react";
import { Navigate } from "react-router-dom";
import { takePendingInvite } from "Components/Invites/hooks";

/**
 * After signing up or logging in from an invite link, goes back to that invite so it can
 * finish joining. Renders nothing otherwise.
 */
export default function PendingInviteRedirect() {
	// Taken once, on first render, so it can't loop.
	const [code] = useState(takePendingInvite);

	return code ? <Navigate to={`/join/${code}`} replace /> : null;
}
