"use strict";


Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToSocketRequest = void 0;

const vscode = require("vscode");
const { getExtensionVersion } = require("./version");
const { HttpEndpoints, HttpStatus, StatusMessage } = require("./constants");
const { getAllOpenEditorsContent, getSelections } = require("./contentRetrieval");
const { setNeedsReload } = require("./register");

/**
 * Respond to a command from the socket, either a GET or POST style.
 */
const respondToSocketRequest = async (command) => {
    switch (command) {
        case HttpEndpoints.CONTENT:
        case HttpEndpoints.SELECTIONS:
        case HttpEndpoints.RELOAD:
        case HttpEndpoints.MARK_FOR_RELOAD:
            return handleGetRequest(command);

        case HttpEndpoints.PING:
            return await handlePostRequest(command);

        default:
            return {
                status: HttpStatus.UNKNOWN_ERROR,
                error: "Not Found"
            };
    }
};
exports.respondToSocketRequest = respondToSocketRequest;

/**
 * Handle GET-variant endpoints (no body/payload).
 */
function handleGetRequest(command) {
    switch (command) {
        case HttpEndpoints.PING:
            // Return extension version
            return {
                status: HttpStatus.OKAY,
                version: getExtensionVersion()
            };

        case HttpEndpoints.CONTENT:
            // Return content of the active editor(s)
            const textfields = getAllOpenEditorsContent();
            if (textfields !== null) {
                return {
                    status: HttpStatus.OKAY,
                    textfields
                };
            }
            return {
                status: HttpStatus.UNKNOWN_ERROR,
                error: "No active editor found"
            };

        case HttpEndpoints.SELECTIONS:
            // Return all selections of the active editor
            const selections = getSelections();
            if (selections !== null) {
                return {
                    status: HttpStatus.OKAY,
                    selections
                };
            }
            return {
                status: HttpStatus.UNKNOWN_ERROR,
                error: "No active editor found"
            };

        case HttpEndpoints.RELOAD:
            // Instruct VS Code to reload the window
            vscode.commands.executeCommand("workbench.action.reloadWindow");
            return {
                status: HttpStatus.OKAY
            };
    }
}

/**
 * Handle POST-variant endpoints.
 */
async function handlePostRequest(command) {
    switch (command) {
        // If `MARK_FOR_RELOAD`, set a flag, so next time the extension is re-registered
        // it can do something different (like refresh). 
        case HttpEndpoints.PING:
            setNeedsReload(true);
            return {
                status: HttpStatus.OKAY,
                message: "Marked for reload"
            };
    }
}