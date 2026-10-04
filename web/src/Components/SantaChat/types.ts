/**
 * A thread named from the viewer's side: "my-person" is the one they're Santa for (they
 * know who it is), "my-santa" is their own Secret Santa (who stays anonymous).
 */
export type ISantaChatSide = "my-person" | "my-santa";

export type ISantaMessage = {
	id: number;
	/** Whether the viewer wrote it. Messages never say who the Santa is. */
	mine: boolean;
	body: string;
	sentAt: string;
};

export type ISantaThread = {
	/** Who the viewer is talking to; only set on "my-person" threads. */
	with: { id: number; name: string } | null;
	messages: ISantaMessage[];
};

/** What the chat modal opens on, with optional text to start the message (e.g. "Ask about this"). */
export type ISantaChatTarget = { groupId: number; groupName: string; side: ISantaChatSide; draft?: string };
