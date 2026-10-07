import { Button, Container, Group, Paper, Text as MantineText } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "Components/Auth/AuthContext";
import { useResendVerificationMutation } from "Components/Auth/hooks";
import { apiErrorMessage } from "Data/Api/Client";
import classes from "Components/Auth/VerifyEmailBanner.module.less";

/**
 * Under the header until someone confirms their email: a nudge, not a wall (everything else
 * works). The link itself lands on /email-verified.
 */
export default function VerifyEmailBanner() {
	const { user } = useAuth();
	const resend = useResendVerificationMutation();

	if (!user || user.emailVerified) {
		return null;
	}

	return (
		<Container size="lg" w="100%" mt="md">
			<Paper withBorder radius="md" className={classes.banner} role="status">
				<Group gap="sm" justify="space-between">
					<MantineText size="sm" className={classes.message}>
						<FontAwesomeIcon icon={faEnvelope} className={classes.icon} />
						{resend.isSuccess
							? "Sent! Check your inbox, and your spam folder just in case."
							: resend.isError
								? apiErrorMessage(resend.error)
								: `Please confirm your email: we sent a link to ${user.email}.`}
					</MantineText>
					{!resend.isSuccess && (
						<Button
							size="xs"
							variant="secondary"
							leftSection={<FontAwesomeIcon icon={faPaperPlane} />}
							loading={resend.isPending}
							onClick={() => resend.mutate()}
						>
							Send it again
						</Button>
					)}
				</Group>
			</Paper>
		</Container>
	);
}
