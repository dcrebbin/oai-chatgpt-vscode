"use strict";


Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;

const vscode = require("vscode");
const fs = require("fs");
const net = require("net");
const os = require("os");

const { getSessionSocketPath, register, deregister } = require("./register");
const { respondToSocketRequest } = require("./m1_endpoints");
const { HttpEndpoints, HttpStatus } = require("./constants");

/**
 * Called when the extension is activated.
 */
function activate(context) {
    // This extension is only designed for macOS usage:
    if (os.platform() !== "darwin") {
        vscode.window.showWarningMessage(
            "The ChatGPT extension is only supported on macOS."
        );
        return;
    }

    console.log("ChatGPT extension is now active!");

    // Ensure the extension is registered:
    const socketPath = getSessionSocketPath();
    if (fs.existsSync(socketPath)) {
        fs.unlinkSync(socketPath);
    }

    // Create a Unix socket server
    const server = net.createServer(socketConn => {
        console.log("Client connected");

        let messageBuffer = Buffer.alloc(0);
        let expectedLength = null;

        socketConn.on("data", async chunk => {
            // Concatenate new data onto buffer
            messageBuffer = Buffer.concat([messageBuffer, chunk]);

            // If we haven't determined message size, read the first 4 bytes (uint32)
            if (expectedLength === null && messageBuffer.length >= 4) {
                expectedLength = messageBuffer.readUInt32LE(0);
                messageBuffer = messageBuffer.subarray(4);
            }

            // If we have a complete message, process it
            if (expectedLength !== null && messageBuffer.length >= expectedLength) {
                const jsonChunk = messageBuffer.subarray(0, expectedLength).toString();
                messageBuffer = messageBuffer.subarray(expectedLength);
                expectedLength = null;
                await respondToCompleteMessage(socketConn, jsonChunk);
            }
        });

        socketConn.on("end", () => {
            console.log("Client disconnected");
        });

        socketConn.on("error", err => {
            console.error("Socket error:", err);
        });
    });

    server.listen(socketPath, () => {
        console.log("Server listening on UNIX domain socket: " + socketPath);
    });

    // When extension is deactivated, close the server & deregister
    context.subscriptions.push({
        dispose: () => {
            server.close();
            deregister();
        }
    });

    register();
    console.log("Registered");
}

function deactivate() {
    // On deactivation, deregister
    deregister();
}

/**
 * Helper to parse JSON message from the client, handle it, and then respond.
 */
async function respondToCompleteMessage(socketConn, rawJson) {
    try {
        const parsed = JSON.parse(rawJson);

        // If the workspace is not trusted and the command is not PING, respond with an error
        if (
            !vscode.workspace.isTrusted &&
            parsed.command !== HttpEndpoints.PING
        ) {
            console.error("Untrusted workspace");
            sendResponse(socketConn, {
                status: HttpStatus.NOT_ALLOWED,
                error:
                    "The workspace must be trusted for the extension to read content."
            });
            return;
        }

        // Otherwise, handle normal command
        const result = await respondToSocketRequest(parsed.command);
        sendResponse(socketConn, result);

    } catch (err) {
        console.error("Error processing message:", err);
        sendResponse(socketConn, {
            success: false,
            error: "Error handling message"
        });
    }
}

/**
 * Send a JSON message back to the socket, preceded by its length (4 bytes).
 */
function sendResponse(socketConn, responseObj) {
    const payloadStr = JSON.stringify(responseObj);
    const lengthBuf = Buffer.alloc(4);
    const payloadBuf = Buffer.from(payloadStr, "utf-8");

    lengthBuf.writeUInt32LE(payloadBuf.length, 0);

    socketConn.write(lengthBuf);
    socketConn.write(payloadBuf);
    socketConn.end();
}