import path from "path";
import { DATA_DIR } from "./env.js";

export const INTERFACE_LIST_PATH = "/sys/class/net";
export const SAVE_STATE_FILE = path.join(DATA_DIR, "state.json");
export const SAVE_STATE_FILE_TEMP = path.join(DATA_DIR, "state.json.tmp");
export const SAVE_USAGE_FILE = path.join(DATA_DIR, "usage.jsonl");

