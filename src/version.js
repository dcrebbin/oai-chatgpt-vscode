"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtensionVersion = void 0;

const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

/**
 * Attempt to read the extension's own package.json to get its version.
 */
function getExtensionVersion() {
    const extensionPath = vscode.extensions.getExtension("openai.openai-chatgpt-adhoc")?.extensionPath;
    if (!extensionPath) {
        return "ERROR_GETTING_VERSION";
    }
    const packageJsonPath = path.join(extensionPath, "package.json");
    const packageJsonContents = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJsonContents.version;
}
exports.getExtensionVersion = getExtensionVersion;