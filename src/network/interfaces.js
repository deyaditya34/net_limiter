import { readdir, access } from "fs/promises";
import { INTERFACE_LIST_PATH } from "../config/constants.js";
import {readBytes} from "./counters.js";

export let interfaceState = {};

export async function initialize() {
	const interfaces = await readdir(INTERFACE_LIST_PATH);

	interfaceState = {};

	for (const interfaceName of interfaces) {
		const interfaceType = await getInterfaceType(interfaceName);
		if (interfaceType === "ethernet" || interfaceType === "wifi") {
			interfaceState[interfaceName] = {
				type: interfaceType,
				lastRx: await readBytes(interfaceName, "rx_bytes"),
				lastTx: await readBytes(interfaceName, "tx_bytes")
			}
		}
	}
}

export async function getInterfaceType(interfaceName) {
	const interfacePath = `/sys/class/net/${interfaceName}`;

	try {
		await access(`${interfacePath}/wireless`);
		return "wifi";
	} catch (err) {
	}

	try {
		await access(`${interfacePath}/device`);
		return "ethernet";
	} catch (err) {
	}

	return "other";
}
