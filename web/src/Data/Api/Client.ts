export type IApiErrorBody = {
	message: string;
	errors?: Record<string, string[]>;
};

export class ApiError extends Error {
	status: number;
	errors?: Record<string, string[]>;

	constructor(status: number, body: IApiErrorBody) {
		super(body.message);

		this.status = status;
		this.errors = body.errors;
	}
}

const BASE_URL = "";

async function getCsrfCookie(): Promise<void> {
	await fetch(`${ BASE_URL }/sanctum/csrf-cookie`, {
		credentials: "include"
	});
}

function readCookie(name: string): string | undefined {
	const match = document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${ name }=`));

	return match
		? decodeURIComponent(match.split("=")[ 1 ])
		: undefined;
}

async function request<TResponse>(
	path: string,
	init: RequestInit = {}
): Promise<TResponse> {
	const method = (init.method ?? "GET").toUpperCase();

	if (method !== "GET") {
		await getCsrfCookie();
	}

	const xsrfToken = readCookie("XSRF-TOKEN");
	const response = await fetch(`${ BASE_URL }/api${ path }`, {
		...init,
		credentials: "include",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
			...init.headers
		}
	});

	if (!response.ok) {
		const body: IApiErrorBody = await response.json().catch(() => ({
			message: `Request to ${ path } failed with status ${ response.status }`
		}));

		throw new ApiError(response.status, body);
	}

	if (response.status === 204) {
		return undefined as TResponse;
	}

	return response.json() as Promise<TResponse>;
}

export const apiClient = {
	get: <TResponse>(path: string) => request<TResponse>(path),
	post: <TResponse>(path: string, body?: unknown) => request<TResponse>(path, {
		method: "POST",
		body: body === undefined ? undefined : JSON.stringify(body)
	}),
	patch: <TResponse>(path: string, body?: unknown) => request<TResponse>(path, {
		method: "PATCH",
		body: body === undefined ? undefined : JSON.stringify(body)
	}),
	delete: <TResponse>(path: string) => request<TResponse>(path, { method: "DELETE" })
};
