import {readFile} from "fs/promises";
import {interfaceState} from "./interfaces.js";

export async function readBytes(INTERFACE, file) {
	const value = await readFile(`/sys/class/net/${INTERFACE}/statistics/${file}`, "utf8");
	return Number(value.trim());
}

export async function getCurrentNetworkUsage() {
	const currentUsage = {};

	for (const interfaceName of Object.keys(interfaceState)) {
		currentUsage[interfaceName] = {
			currentRx: await readBytes(interfaceName, "rx_bytes"),
			currentTx: await readBytes(interfaceName, "tx_bytes"),
		}
	}
	return currentUsage;
}
