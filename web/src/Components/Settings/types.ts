/** The kinds of notification people can switch off (by email and push separately), matching the API's EmailKind enum. */
export type IEmailKind =
	| "assignments"
	| "santa_chat"
	| "reminders"
	| "exchange_updates"
	| "nudges"
	| "gift_ideas"
	| "new_members";

/** Whether each kind is on. Everything starts on. */
export type IEmailPreferences = Record<IEmailKind, boolean>;
