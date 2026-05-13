"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEmitter = void 0;
exports.emitAdminEvent = emitAdminEvent;
const events_1 = require("events");
exports.adminEmitter = globalThis.__adminEmitter ??
    (globalThis.__adminEmitter = new events_1.EventEmitter().setMaxListeners(200));
function emitAdminEvent(type, payload) {
    exports.adminEmitter.emit("admin", { type, ts: Date.now(), ...(payload ?? {}) });
}
