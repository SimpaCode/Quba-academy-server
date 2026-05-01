/**
 * src/config/db.ts
 *
 * Persistent MongoDB connection with connection pooling.
 * The connection pool stays warm between requests — a key
 * performance advantage over serverless functions.
 *
 * maxPoolSize: 10 → up to 10 concurrent DB operations without
 * waiting for a connection slot to free up.
 */
export declare function connectDB(): Promise<void>;
export declare function disconnectDB(): Promise<void>;
//# sourceMappingURL=db.d.ts.map