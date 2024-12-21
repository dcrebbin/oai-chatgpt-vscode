"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const assert = require("assert");
const vscode = require("vscode");

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("Sample test", () => {
        // Basic example tests for array indexOf
        assert.strictEqual([1, 2, 3].indexOf(5), -1);
        assert.strictEqual([1, 2, 3].indexOf(0), -1);
    });
});