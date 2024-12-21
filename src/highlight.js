"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightLines = highlightLines;
exports.highlightRange = highlightRange;
exports.removeHighlights = removeHighlights;
exports.highlightRangeFromOffsets = highlightRangeFromOffsets;

const vscode = require("vscode");
const { editorForID } = require("./contentRetrieval");
const { throwUnknownTextFieldError } = require("./errors");

// Keep track of created decorations so we can remove or fade them out later.
const decorationStore = {};

/** Initial (maximum) opacity for highlight backgrounds. */
const initialOpacity = 0.2;

/**
 * Highlight the given array of line numbers for the specified text field.
 */
async function highlightLines(lines, textFieldId) {
    const editor = editorForID(textFieldId);
    if (!editor) {
        throwUnknownTextFieldError(textFieldId);
    }

    // For each line, compute the line’s full Range, then highlight it.
    for (const line of lines) {
        const lineLength = editor.document.lineAt(line).range.end.character;
        const range = new vscode.Range(line, 0, line, lineLength);
        await highlightRange(range, textFieldId);
    }
}

/**
 * Utility to pause for `ms` milliseconds (used for the fade-out).
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Highlight a given Range in the editor, placing a highlight decoration.
 */
async function highlightRange(range, textFieldId) {
    const editor = editorForID(textFieldId);
    if (!editor) {
        throwUnknownTextFieldError(textFieldId);
    }

    // Reveal the range in the viewport (center if out of view).
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

    // Create a text decoration with background color (yellow).
    const decoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: `rgba(255, 255, 0, ${initialOpacity})`,
        isWholeLine: true,
    });
    editor.setDecorations(decoration, [range]);

    // Listen for changes so we can remove this highlight automatically if the document changes.
    const disposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === editor.document) {
            decoration.dispose();
            disposable.dispose();
        }
    });

    // Store the highlight so we can remove or fade it later.
    if (!decorationStore[textFieldId]) {
        decorationStore[textFieldId] = [];
    }
    decorationStore[textFieldId].push({ range, decoration });
}

/**
 * Fade out (over time) and remove all highlights for a given text field.
 */
async function removeHighlights(textFieldId) {
    const editor = editorForID(textFieldId);
    if (!editor) {
        throwUnknownTextFieldError(textFieldId);
    }

    const decorations = decorationStore[textFieldId];
    if (!decorations) {
        return; // nothing to remove
    }

    // Fade out each highlight step by step
    const fadeTasks = decorations.map(async entry => {
        let currentDeco = entry.decoration;

        const steps = 10;          // total fade steps
        const totalDuration = 500; // total fade time in ms
        const stepDuration = totalDuration / steps;

        for (let i = 0; i <= steps; i++) {
            const fraction = i / steps;
            const newOpacity = initialOpacity * (1 - fraction);

            // Create a fresh decoration with the updated opacity
            const nextDeco = vscode.window.createTextEditorDecorationType({
                backgroundColor: `rgba(255, 255, 0, ${newOpacity})`,
                isWholeLine: true,
            });

            // Apply it
            editor.setDecorations(nextDeco, [entry.range]);

            // Dispose the previous decoration
            if (currentDeco) {
                currentDeco.dispose();
            }
            currentDeco = nextDeco;

            // Wait a bit before next step
            await sleep(stepDuration);
        }

        // Finally, dispose the last decoration
        if (currentDeco) {
            currentDeco.dispose();
        }
    });

    await Promise.all(fadeTasks);

    // Clear them from the store
    decorations.forEach(d => {
        d.decoration.dispose();
    });
    delete decorationStore[textFieldId];
}

/**
 * Highlight a range specified by absolute offsets (rather than lines) in the document.
 */
async function highlightRangeFromOffsets(startOffset, endOffset, textFieldId) {
    const editor = editorForID(textFieldId);
    if (!editor) {
        throwUnknownTextFieldError(textFieldId);
    }

    const rng = rangeFromOffsets(startOffset, endOffset, editor.document);
    if (rng) {
        highlightRange(rng, textFieldId);
    }
}

/**
 * Convert absolute byte offsets in the entire document into a `Range`.
 * If not valid, return `null`.
 */
function rangeFromOffsets(startOffset, endOffset, doc) {
    let offsetSoFar = 0;
    let startLine = 0, startChar = 0;
    let endLine = 0, endChar = 0;

    for (let i = 0; i < doc.lineCount; i++) {
        const lineText = doc.lineAt(i).text;
        const lineLenPlusOne = lineText.length + 1; // +1 for newline

        // Check if startOffset lies within this line
        if (offsetSoFar <= startOffset && offsetSoFar + lineLenPlusOne > startOffset) {
            startLine = i;
            startChar = startOffset - offsetSoFar;
        }

        // Check if endOffset lies within this line
        if (offsetSoFar <= endOffset && offsetSoFar + lineLenPlusOne > endOffset) {
            endLine = i;
            endChar = endOffset - offsetSoFar;
            break;
        }

        offsetSoFar += lineLenPlusOne;
    }

    // If both line/char positions are valid, create the Range
    if (startLine >= 0 && endLine >= 0) {
        const startPos = new vscode.Position(startLine, startChar);
        const endPos = new vscode.Position(endLine, endChar);
        return new vscode.Range(startPos, endPos);
    }

    return null;
}