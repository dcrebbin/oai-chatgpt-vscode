"use strict";

/**
 * HttpStatus enum
 * E.g. 200 = OK, 400 = BAD_REQUEST, 405 = NOT_ALLOWED
 */
var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OKAY"] = 200] = "OKAY";
    HttpStatus[HttpStatus["UNKNOWN_ERROR"] = 400] = "UNKNOWN_ERROR";
    HttpStatus[HttpStatus["NOT_ALLOWED"] = 405] = "NOT_ALLOWED";
})(HttpStatus || (exports.HttpStatus = HttpStatus = {}));

/**
 * StatusMessage enum
 * E.g. "SUCCESS" = "success", "UNKNOWN_ERROR" = "Unknown error"
 */
var StatusMessage;
(function (StatusMessage) {
    StatusMessage["SUCCESS"] = "success";
    StatusMessage["UNKNOWN_ERROR"] = "Unknown error";
})(StatusMessage || (exports.StatusMessage = StatusMessage = {}));

/** A helpful error string. */
exports.UNKNOWN_ERROR = "UNKNOWN_ERROR";

/**
 * HttpEndpoints enum
 * e.g. "content" = GET content from editor, "ping" = PING, "selections" = get selections, etc.
 */
var HttpEndpoints;
(function (HttpEndpoints) {
    HttpEndpoints["CONTENT"] = "content";
    HttpEndpoints["PING"] = "ping";
    HttpEndpoints["SELECTIONS"] = "selections";
    HttpEndpoints["RELOAD"] = "reload";
    HttpEndpoints["MARK_FOR_RELOAD"] = "markForReload";
})(HttpEndpoints || (exports.HttpEndpoints = HttpEndpoints = {}));

/** 
 * For convenience, track which endpoints exist in this extension.
 * This is effectively a simple version manifest.
 */
exports.endpointVersions = {
    [HttpEndpoints.CONTENT]: 1,
    [HttpEndpoints.PING]: 1,
    [HttpEndpoints.SELECTIONS]: 1,
    [HttpEndpoints.RELOAD]: 1,
    [HttpEndpoints.MARK_FOR_RELOAD]: 1
};

/**
 * HttpMethod enum
 * e.g. GET, POST
 */
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));

/**
 * IncomingMessageState enum
 * e.g. END, DATA
 */
var IncomingMessageState;
(function (IncomingMessageState) {
    IncomingMessageState["END"] = "end";
    IncomingMessageState["DATA"] = "data";
})(IncomingMessageState || (exports.IncomingMessageState = IncomingMessageState = {}));