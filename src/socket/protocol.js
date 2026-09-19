export function encodeMessage(message) {
	return JSON.stringify(message) + "\n";
}

export function decodeMessage(message) {
	return JSON.parse(message);
}
