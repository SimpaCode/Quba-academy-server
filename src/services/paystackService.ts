/**
 * src/services/paystackService.ts
 *
 * Paystack API wrapper for billing operations.
 * Docs: https://paystack.com/docs/api
 */

import { requireEnv } from "../config/env";

const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const secretKey = requireEnv("PAYSTACK_SECRET_KEY");

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

  return res.json() as Promise<T>;
}

export interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export async function getCustomer(
  customerCode: string,
): Promise<PaystackCustomer> {
  const data = await paystackRequest<{ data: PaystackCustomer }>(
    `/customer/${customerCode}`,
  );
  return data.data;
}

export interface PaystackSubscription {
  id: number;
  status: "active" | "non-renewing" | "attention" | "completed" | "cancelled";
  plan: { name: string; plan_code: string };
  next_payment_date?: string;
  createdAt: string;
}

export async function getSubscriptions(
  customerCode: string,
): Promise<PaystackSubscription[]> {
  const data = await paystackRequest<{ data: PaystackSubscription[] }>(
    `/subscription?customer=${customerCode}`,
  );
  return data.data;
}
