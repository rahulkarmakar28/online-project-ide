import util from "node:util";
import child_process from "node:child_process";

export const execPromisified = util.promisify(child_process.exec);
