"use strict";
/**
 * src/services/paystackService.ts
 *
 * Paystack API wrapper for billing operations.
 * Docs: https://paystack.com/docs/api
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomer = getCustomer;
exports.getSubscriptions = getSubscriptions;
const env_1 = require("../config/env");
const PAYSTACK_BASE = "https://api.paystack.co";
async function paystackRequest(path, options = {}) {
    const secretKey = (0, env_1.requireEnv)("PAYSTACK_SECRET_KEY");
    const res = await fetch(`${PAYSTACK_BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Paystack API error ${res.status}: ${text}`);
    }
    return res.json();
}
async function getCustomer(customerCode) {
    const data = await paystackRequest(`/customer/${customerCode}`);
    return data.data;
}
async function getSubscriptions(customerCode) {
    const data = await paystackRequest(`/subscription?customer=${customerCode}`);
    return data.data;
}
//# sourceMappingURL=paystackService.js.map