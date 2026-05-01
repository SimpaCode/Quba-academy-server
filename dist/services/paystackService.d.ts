/**
 * src/services/paystackService.ts
 *
 * Paystack API wrapper for billing operations.
 * Docs: https://paystack.com/docs/api
 */
export interface PaystackCustomer {
    id: number;
    customer_code: string;
    email: string;
    first_name?: string;
    last_name?: string;
}
export declare function getCustomer(customerCode: string): Promise<PaystackCustomer>;
export interface PaystackSubscription {
    id: number;
    status: "active" | "non-renewing" | "attention" | "completed" | "cancelled";
    plan: {
        name: string;
        plan_code: string;
    };
    next_payment_date?: string;
    createdAt: string;
}
export declare function getSubscriptions(customerCode: string): Promise<PaystackSubscription[]>;
//# sourceMappingURL=paystackService.d.ts.map