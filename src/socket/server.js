import net from "net";
import fs from "fs";
import { encodeMessage, decodeMessage } from "./protocol.js";
import { handleRequest } from "../commands/handler.js";

const SOCKET_PATH = "test.sock";

export const server = net.createServer((socket) => {
	console.log("client connected");

	let buffer = "";
	socket.on("data", async (data) => {
		buffer += data.toString();

		let newLineIndex;

		while ((newLineIndex = buffer.indexOf("\n")) !== -1) {
			const message = buffer.slice(0, newLineIndex);

			buffer = buffer.slice(newLineIndex + 1);

			if (message.length === 0) continue;

			let request;

			try {
				request = decodeMessage(message);
			} catch (err) {
				const response = {
					id: null,
					success: false,
					error: "invalid json"
				}

				socket.write(encodeMessage(response));
				continue;
			}

			try {
				const data = await handleRequest(request);
				const response = {
					id: request.id,
					success: true,
					data
				}

				socket.write(encodeMessage(response));
			} catch (err) {
				console.log("err -", err);
				const response = {
					id: request.id,
					success: false,
					error: err.message
				}

				socket.write(encodeMessage(response));
			}
		}
	});

	socket.on("end", () => {
		console.log("client disconnected");
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

