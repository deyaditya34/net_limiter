export function encodeMessage(message) {
	return JSON.stringify(message) + "\n";
}

export function decodeMessage(message) {
	return JSON.parse(message);
}

export function createSuccessResponse(data) {
	return {
		success: true,
		data: data
	}
}

export function createErrorResponse(error) {
	return {
		success: false,
		error: {
			code: error.code,
			message: error.message
		}
	}
}

export function parseMessages(buffer = "", data) {
	buffer += data.toString();

	const messages = [];

	let newlineIndex;

	while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
		const message = buffer.slice(0, newlineIndex);

		buffer = buffer.slice(newlineIndex + 1);

		if (message.length === 0) {
			continue;
		}

		messages.push(message);
	}

	return {
		buffer,
		messages
	}
}

export function validateServerRequest(request) {
	if (!request || typeof request !== "object") {
		throw new Error("invalid request");
	}

	if (typeof request.command !== "string") {
		throw new Error("command is required");
	}

	if (request.options !== undefined && (typeof request.options !== "object" || request.options === null)) {
		throw new Error("invalid options");
	}

	if (request.subCommand !== undefined && typeof request.subCommand !== "string") {
		throw new Error("invalid subCommand");
	}
}
