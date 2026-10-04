import { useEffect, useRef } from "react";
import { Button, Group, Paper, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import { useUpdateAvailable } from "Components/AppUpdates/hooks";
import classes from "Components/AppUpdates/UpdateNotice.module.less";

/**
 * Once a newer version is live: a small banner offering to refresh, and the next move to
 * another page loads it for real. Never reloads on its own while someone's on a page, so a
 * half-typed message or form is never lost.
 */
function UpdateNoticeBanner() {
	const { pathname } = useLocation();
	const pathWhenFound = useRef(pathname);

	useEffect(() => {
		if (pathname !== pathWhenFound.current) {
			window.location.reload();
		}
	}, [pathname]);

	return (
		<Paper shadow="md" radius="md" withBorder className={classes.banner} role="status">
			<Group gap="sm" wrap="nowrap">
				<MantineText size="sm">A new version of Secret Santa is ready!</MantineText>
				<Button
					size="xs"
					className={classes.refresh}
					leftSection={<FontAwesomeIcon icon={faArrowsRotate} />}
					onClick={() => window.location.reload()}
				>
					Refresh
				</Button>
			</Group>
		</Paper>
	);
}

export default function UpdateNotice() {
	return useUpdateAvailable() ? <UpdateNoticeBanner /> : null;
}
