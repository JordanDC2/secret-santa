type IEmojiProps = {
	children: string;
};

/**
 * Decorative emoji, e.g. in a Button's leftSection so Mantine spaces it from the label.
 * Hidden from screen readers so they don't announce "wrapped gift" before every action.
 */
export default function Emoji({ children }: IEmojiProps) {
	return <span aria-hidden="true">{children}</span>;
}
