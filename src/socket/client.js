import net from "net";
import { encodeMessage, decodeMessage } from "./protocol.js";

const SOCKET_PATH = "test.sock";

const requests = [
	{
		id: 1,
		command: "usage",
		options: {
			days: 30
		}
	},
	{
		id: 2,
		command: "usage",
		options: {
			days: 2
		}
	},
	{
		id: 3,
		command: "usage",
		options: {
			from: "2026-09-01",
			to: "2026-09-18"
		}
	},
	{
		id: 4,
		command: "usage",
		options: {
			days: 350
		}
	}
]

const client = net.createConnection(SOCKET_PATH, () => {
	console.log("connected to server");

	for (const request of requests) {
		client.write(encodeMessage(request));
	}
});

let buffer = "";
client.on("data", (data) => {
	buffer += data.toString();

	let newLineIndex;
	while ((newLineIndex = buffer.indexOf("\n")) !== -1) {
		const message = buffer.slice(0, newLineIndex);
		buffer = buffer.slice(newLineIndex + 1);

		if (message.length === 0) continue;

		const response = decodeMessage(message);
		console.log("response -", response);

		client.end();
	}
})

client.on("end", () => {
	console.log("connection closed");
});

client.on("error", (err) => {
	console.error("Socket error -", err.message);
});
