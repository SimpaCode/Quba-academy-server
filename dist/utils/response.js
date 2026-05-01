"use strict";
/**
 * src/utils/response.ts
 *
 * Consistent response helpers — all route handlers use these
 * instead of res.json() directly to ensure a uniform API shape.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOk = sendOk;
exports.sendCreated = sendCreated;
exports.sendNoContent = sendNoContent;
exports.sendBadRequest = sendBadRequest;
exports.sendUnauthorized = sendUnauthorized;
exports.sendForbidden = sendForbidden;
exports.sendNotFound = sendNotFound;
exports.sendConflict = sendConflict;
exports.sendTooManyRequests = sendTooManyRequests;
exports.sendServerError = sendServerError;
function sendOk(res, data, status = 200) {
    res.status(status).json({ success: true, data });
}
function sendCreated(res, data) {
    res.status(201).json({ success: true, data });
}
function sendNoContent(res) {
    res.status(204).send();
}
function sendBadRequest(res, msg, code) {
    res.status(400).json({ success: false, msg, ...(code ? { code } : {}) });
}
function sendUnauthorized(res, msg = "Authentication required.") {
    res.status(401).json({ success: false, msg });
}
function sendForbidden(res, msg = "You do not have permission to do this.", options) {
    res.status(403).json({ success: false, msg, ...(options ?? {}) });
}
function sendNotFound(res, resource = "Resource") {
    res.status(404).json({ success: false, msg: `${resource} not found.` });
}
function sendConflict(res, msg) {
    res.status(409).json({ success: false, msg });
}
function sendTooManyRequests(res) {
    res
        .status(429)
        .json({ success: false, msg: "Too many requests. Please try again later." });
}
function sendServerError(res, msg = "Something went wrong. Please try again.", err) {
    if (err) {
        console.error("[API Error]", err instanceof Error ? err.message : err);
    }
    res.status(500).json({ success: false, msg });
}
//# sourceMappingURL=response.js.map