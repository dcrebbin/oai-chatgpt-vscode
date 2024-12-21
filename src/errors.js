"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.throwUnknownTextFieldError = void 0;

/**
 * Throw an error if we cannot find the requested text field (i.e. Editor).
 */
function throwUnknownTextFieldError(textFieldId) {
    throw new Error("No editor for id " + textFieldId + " found");
}
exports.throwUnknownTextFieldError = throwUnknownTextFieldError;