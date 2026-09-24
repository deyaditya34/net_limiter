import net from "net";
import fs from "fs";
import {
	encodeMessage, decodeMessage, validateRequest,
	createSuccessResponse, createErrorResponse, parseMessages
} from "./protocol.js";
import { handleRequest } from "../commands/handler.js";

const SOCKET_PATH = "test.sock";

try {
	fs.unlinkSync(SOCKET_PATH);
} catch (err) {
	console.log("err in index.js -", err.message);
}

export const server = net.createServer((socket) => {
	console.log("client connected");

	let watchInterval = null;
	let buffer = "";

	socket.on("data", async (data) => {
		const result = parseMessages(buffer, data);
		buffer = result.buffer;

		for (const message of result.messages) {
			let request;

			try {
				request = decodeMessage(message);
			} catch (err) {
				const errorResponse = createErrorResponse(err);

				socket.write(encodeMessage(errorResponse));
				continue;
			}

			try {
				const validatedRequest = validateRequest(request);
				if (validatedRequest.valid) {
					if (request.command === "speed" && request.options?.watch) {
						if (watchInterval === null) {

							watchInterval = setInterval(async () => {
								const data = await handleRequest(request);
								const successResponse = createSuccessResponse(data);

								socket.write(encodeMessage(successResponse));
							}, 1000);
						};
					}
					else {
						const data = await handleRequest(request);
						const successResponse = createSuccessResponse(data);

						socket.write(encodeMessage(successResponse));
						socket.end();
					}
				}
			} catch (err) {
				const errorResponse = createErrorResponse(err);

				socket.write(encodeMessage(errorResponse));
			}
		}
	});

	socket.on("close", () => {
		if (watchInterval) {
			clearInterval(watchInterval);
			watchInterval = null;
		}
		console.log("close event: Client disconnected");
	});

	socket.on("end", () => {
		console.log("end event: client disconnected");
	});

	socket.on("error", (err) => {
		console.error("Client socket error -", err.message);
	});
});

server.on("error", (err) => {
	console.error("Server error -", err.message);
});

server.listen(SOCKET_PATH, () => {
	console.log("server is listening on ", SOCKET_PATH);
});

