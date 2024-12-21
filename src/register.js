"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionSocketPath = exports.setNeedsReload = exports.deregister = exports.register = void 0;

const vscode = require("vscode");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { getExtensionVersion } = require("./version");
const { randomUUID } = require("crypto");
const { endpointVersions } = require("./constants");

/**
 * This extension’s name is “openai.chatgpt-adhoc”, plus the appName from VS Code
 */
const extensionName = "oai_pwai " + vscode.env.appName;
const workspaceName = vscode.workspace.name ?? vscode.env.appName;
const extensionID = vscode.env.appName + "-" + randomUUID();

/**
 * Some global variable that the extension uses to note we want to reload.
 */
let needsReload = false;

/**
 * Return the path to a directory in `~/Library/Application Support/...` 
 * (on macOS) or some other location, where we create a special JSON file
 * that the ChatGPT app can detect.
 */
function sessionPath() {
    return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "com.openai.chat",
        "app_pairing_extensions",
        extensionID
    );
}

/**
 * Return the path to the Unix domain socket used for communication.
 * e.g. /tmp/<extensionID>.sock
 */
function getSessionSocketPath() {
    return "/tmp/" + extensionID + ".sock";
}
exports.getSessionSocketPath = getSessionSocketPath;

/**
 * Mark that we want a reload, then deregister + re-register so our JSON file
 * is updated with `needsReload: true`.
 */
function setNeedsReload(val) {
    needsReload = val;
    deregister();
    register();
}
exports.setNeedsReload = setNeedsReload;

/**
 * Remove the JSON file and the socket file, if they exist.
 */
function deregister() {
    console.log("Deregister", sessionPath());

    if (fs.existsSync(sessionPath())) {
        fs.unlinkSync(sessionPath());
    }
    if (fs.existsSync(getSessionSocketPath())) {
        fs.unlinkSync(getSessionSocketPath());
    }
}
exports.deregister = deregister;

/**
 * Create / rewrite the JSON file that the ChatGPT macOS app is looking for,
 * describing which extension is running, what workspace is open, etc.
 */
function register() {
    // Try to determine the real "bundle ID" for the running editor:
    const bundleID = (() => {
        switch (vscode.env.appName) {
            case "Visual Studio Code":
                return "com.microsoft.VSCode";
            case "Visual Studio Code - Insiders":
                return "com.microsoft.VSCodeInsiders";
            case "VSCodium":
                return "com.vscodium";
            case "Cursor":
                return "com.todesktop.230313mzl4w4u92";
            case "Windsurf":
                return "com.exafunction.windsurf";
        }
        return null;
    })();

    const socketPath = getSessionSocketPath();

    const payload = {
        appName: vscode.env.appName,
        bundleID,
        extensionVersion: getExtensionVersion(),
        extensionName,
        workspaceName,
        id: extensionID,
        capabilities: endpointVersions,
        needsReload,
        socketPath,
        timestamp: Date.now()
    };

    const dir = path.dirname(sessionPath());
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(sessionPath(), JSON.stringify(payload), "utf8");
    console.log("Wrote payload to " + sessionPath());

    // If the socket path exists, let’s chmod it
    if (fs.existsSync(socketPath)) {
        fs.chmodSync(socketPath, 0o600);
    } else {
        console.error("Socket file does not exist");
    }

    watchSessionPath();
}

/**
 * Watches the session path for changes; if the file is removed,
 * we can try to re-register or warn the user.
 */
function watchSessionPath() {
    const sp = sessionPath();
    if (fs.existsSync(sp)) {
        const watcher = fs.watch(sp, event => {
            if (!fs.existsSync(sp)) {
                const option1 = "Reregister";
                const option2 = "Dismiss";
                vscode.window
                    .showWarningMessage(
                        "The ChatGPT extension cannot find its registration file",
                        option1,
                        option2
                    )
                    .then(choice => {
                        if (choice === option1) {
                            register();
                        }
                    });
                watcher.close();
            }
        });
    } else {
        console.error("Session path does not exist, cannot watch file.");
    }
}