"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.editorForID = editorForID;
exports.getSelections = getSelections;
exports.getAllOpenEditorsContent = getAllOpenEditorsContent;

const vscode = require("vscode");

/**
 * Find and return the visible text editor whose document.fileName matches the
 * given textFieldId, or null if none is found.
 */
function editorForID(textFieldId) {
    const visibleEditors = vscode.window.visibleTextEditors;
    const match = visibleEditors.find(editor => editor.document.fileName === textFieldId);
    return match || null;
}

/**
 * Retrieve the selections (i.e., selected text and the line of the selection’s end)
 * from all visible text editors, ignoring any that have empty selections.
 */
function getSelections() {
    const editors = vscode.window.visibleTextEditors;

    // For each editor, if its selection is non-empty,
    // return the selected text plus the line number of the selection end.
    return editors
        .map(editor => {
            if (!editor || editor.selection.isEmpty) {
                return null;
            }
            const selectedText = editor.document.getText(editor.selection);
            const selectionLine = editor.selection.end.line;
            return {
                selectedText,
                selectionLine
            };
        })
        .filter(entry => entry !== null);
}

/**
 * Gather information from all visible editors:
 *  - id/filename
 *  - full text content
 *  - selected text (if different from the entire document)
 *  - selection range in (location,length) offset form
 *  - selection line number
 */
function getAllOpenEditorsContent() {
    const editors = vscode.window.visibleTextEditors;

    return editors
        .map(editor => {
            const doc = editor.document;
            const fullContent = doc.getText();
            const fileId = doc.fileName;

            // Only non-empty selections get included
            let selectedText = editor.selection.isEmpty
                ? null
                : doc.getText(editor.selection);

            // If the selected text is the entire document, set to null.
            if (selectedText === fullContent) {
                selectedText = null;
            }

            // Compute selection offsets
            const startOffset = doc.offsetAt(editor.selection.start);
            const endOffset = doc.offsetAt(editor.selection.end);
            const selectionRange = editor.selection.isEmpty
                ? null
                : {
                    location: startOffset,
                    length: endOffset - startOffset
                };

            // The line number where selection ends
            const selectionLine = editor.selection.isEmpty
                ? null
                : editor.selection.end.line;

            return {
                id: fileId,
                content: fullContent,
                filename: fileId,   // same as id
                selectedText,
                selectionRange,
                selectionLine
            };
        })
        .filter(entry => !!entry); // remove any falsy (null/undefined)
}