import type { ReactNode } from "react";
import { Code, Group, Stack, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import SectionCard from "Components/Common/SectionCard";
import FailedJobsList from "Components/Admin/FailedJobsList";
import { formatBytes, formatDateTime, timeAgo } from "Components/Admin/format";
import type { ISystemHealth } from "Components/Admin/types";
import classes from "Components/Admin/SystemHealthSection.module.less";

// The nightly backup runs at 03:00; more than a day and a bit since the last one means it missed.
const BACKUP_OVERDUE_HOURS = 26;
// Queued emails normally go within seconds; this long means the worker has probably stopped.
const QUEUE_STUCK_MINUTES = 10;

function hoursSince(iso: string): number {
	return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

/** One line of the health check: a status icon and label, never color alone. */
function HealthRow({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
	return (
		<Group gap="sm" wrap="nowrap" align="flex-start">
			<MantineText c={ok ? "green" : "orange"} className={classes.icon} aria-hidden>
				<FontAwesomeIcon icon={ok ? faCircleCheck : faTriangleExclamation} fixedWidth />
			</MantineText>
			<div>
				<MantineText size="sm" fw={600}>
					{label}
					{!ok && <span className={classes.attention}> (needs a look)</span>}
				</MantineText>
				<MantineText size="sm" c="dimmed" component="div">
					{children}
				</MantineText>
			</div>
		</Group>
	);
}

export default function SystemHealthSection({ health }: { health: ISystemHealth }) {
	const waiting = health.queuedJobs.reduce((sum, jobs) => sum + jobs.count, 0);
	// ISO timestamps compare correctly as strings, so the smallest is the oldest.
	const oldestDue = health.queuedJobs.reduce<string | undefined>(
		(oldest, jobs) =>
			jobs.oldestDueAt !== null && (oldest === undefined || jobs.oldestDueAt < oldest) ? jobs.oldestDueAt : oldest,
		undefined,
	);
	const queueStuck = oldestDue !== undefined && hoursSince(oldestDue) * 60 > QUEUE_STUCK_MINUTES;
	const backupOk = health.lastBackup !== null && hoursSince(health.lastBackup.finishedAt) < BACKUP_OVERDUE_HOURS;

	return (
		<SectionCard title="System health">
			<Stack gap="md">
				<HealthRow ok={health.version !== null} label="Live version">
					{health.version ? <Code>{health.version}</Code> : "No build found."}
				</HealthRow>
				<HealthRow ok={!queueStuck} label="Emails and live updates">
					{waiting === 0
						? "Nothing waiting to send."
						: `${waiting} waiting (${health.queuedJobs.map((jobs) => `${jobs.queue}: ${jobs.count}`).join(", ")}), oldest due ${timeAgo(oldestDue ?? "")}.`}
				</HealthRow>
				<HealthRow ok={backupOk} label="Nightly backup">
					{health.lastBackup
						? `${formatDateTime(health.lastBackup.finishedAt)} (${timeAgo(health.lastBackup.finishedAt)}), ${formatBytes(health.lastBackup.bytes)}.`
						: "No backup has reported in yet."}
				</HealthRow>
				<HealthRow ok={health.failedJobs.length === 0} label="Failed jobs">
					{health.failedJobs.length === 0 ? "None." : <FailedJobsList jobs={health.failedJobs} />}
				</HealthRow>
				<HealthRow ok={health.recentErrors.length === 0} label="Recent errors">
					{health.recentErrors.length === 0 ? (
						"Nothing in the log."
					) : (
						<Stack gap={6} mt={4}>
							{health.recentErrors.map((error) => (
								<div key={`${error.loggedAt}-${error.message}`}>
									<MantineText size="xs">
										{formatDateTime(error.loggedAt)} · {error.level}
									</MantineText>
									<Code block className={classes.message}>
										{error.message}
									</Code>
								</div>
							))}
						</Stack>
					)}
				</HealthRow>
			</Stack>
		</SectionCard>
	);
}
