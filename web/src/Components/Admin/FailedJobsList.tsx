import { useState } from "react";
import { Alert, Button, Code, Group, Stack, Text as MantineText } from "@mantine/core";
import ConfirmModal from "Components/Admin/ConfirmModal";
import { formatDateTime } from "Components/Admin/format";
import { useDropFailedJobMutation, useRetryFailedJobMutation } from "Components/Admin/hooks";
import type { IFailedJob } from "Components/Admin/types";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Admin/SystemHealthSection.module.less";

/** Jobs that ran out of retries (usually an email): try again once the cause is fixed, or let go. */
export default function FailedJobsList({ jobs }: { jobs: IFailedJob[] }) {
	const retry = useRetryFailedJobMutation();
	const drop = useDropFailedJobMutation();
	const [dropping, setDropping] = useState<IFailedJob | null>(null);

	return (
		<Stack gap="sm" mt={4}>
			{retry.isError && <Alert color="red">{apiErrorMessage(retry.error)}</Alert>}
			{jobs.map((job) => (
				<div key={job.uuid}>
					<MantineText size="sm" c="bright">
						{job.job} · {formatDateTime(job.failedAt)}
					</MantineText>
					<Code block className={classes.message}>
						{job.error}
					</Code>
					<Group gap="xs" mt={6}>
						<Button
							size="xs"
							variant="secondary"
							loading={retry.isPending && retry.variables === job.uuid}
							onClick={() => retry.mutate(job.uuid)}
						>
							Retry
						</Button>
						<Button size="xs" variant="subtle" color="red" onClick={() => setDropping(job)}>
							Drop
						</Button>
					</Group>
				</div>
			))}
			<ConfirmModal
				opened={dropping !== null}
				title="Drop this failed job?"
				prompt={`${dropping?.job ?? "It"} won't be tried again. If it was an email, it won't be sent.`}
				confirmLabel="Drop job"
				isPending={drop.isPending}
				error={drop.error}
				onConfirm={() => dropping && drop.mutate(dropping.uuid, { onSuccess: () => setDropping(null) })}
				onClose={() => {
					drop.reset();
					setDropping(null);
				}}
			/>
		</Stack>
	);
}
