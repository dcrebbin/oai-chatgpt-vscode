"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceSelection = exports.setContent = void 0;

const vscode = require("vscode");
const { editorForID } = require("./contentRetrieval");
const { throwUnknownTextFieldError } = require("./errors");

/**
 * Replace the entire content of a given editor.
 */
async function setContent(newContent, textFieldId) {
    const editor = editorForID(textFieldId);
    if (!editor) {
        throwUnknownTextFieldError(textFieldId);
    }

    const doc = editor.document;
    // Replace entire file from start (0) to the end of the file
    const range = new vscode.Range(
        doc.positionAt(0),
        doc.positionAt(doc.getText().length)
    );

    await editor.edit(editBuilder => {
        editBuilder.replace(range, newContent);
    });

    // Move cursor to the end of the newly inserted content
    const endPos = editor.document.positionAt(newContent.length);
    editor.selection = new vscode.Selection(endPos, endPos);
}
exports.setContent = setContent;

/**
 * Replace only the current selection with the new content.
 */
async function replaceSelection(newContent, textFieldId) {
    const editor = editorForID(textFieldId);
    if (!editor) {
        throwUnknownTextFieldError(textFieldId);
    }

    const selection = editor.selection;
    const range = new vscode.Range(selection.start, selection.end);

    await editor.edit(editBuilder => {
        editBuilder.replace(range, newContent);
    });
    // Place cursor at the start of replaced region
    editor.selection = new vscode.Selection(range.start, range.start);
}
exports.replaceSelection = replaceSelection;