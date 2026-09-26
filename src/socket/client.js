import net from "net";
import { encodeMessage, decodeMessage, parseMessages, createErrorResponse } from "./protocol.js";
import { cliParser } from "../cli/cliParser.js";
import { validateCLIRequest } from "../cli/validateCliRequest.js";
import { formatResponse } from "../cli/responseFormatter.js";

const SOCKET_PATH = "test.sock";

const client = net.createConnection(SOCKET_PATH, () => {
});

let input = process.argv.slice(2).join(" ");

if (input.trim() === "") {
	input = "help";
}

let request;
try {
	request = cliParser(input);
} catch (err) {
	const errorResponse = createErrorResponse(err);
	console.log(errorResponse);
}

try {
	validateCLIRequest(request);
	client.write(encodeMessage(request));
} catch (err) {
	const errorResponse = createErrorResponse(err);
	console.log(errorResponse);
	process.exit(1);
};

let buffer = "";
client.on("data", (data) => {
	const result = parseMessages(buffer, data);
	buffer = result.buffer;

	for (const message of result.messages) {

		const response = decodeMessage(message);
		const formattedResponse = formatResponse(request, response);
		console.log(formattedResponse);
	}
})

client.on("close", () => {
	//	console.log("close event: Disconnected from server");
	process.exit(0);
});

client.on("end", () => {
	//	console.log("end event: connection closed");
});

client.on("error", (err) => {
	console.error("socket error -", err.message);
});

process.on("SIGINT", () => {
	client.end();
});

process.on("SIGTERM", () => {
	client.end();
});
