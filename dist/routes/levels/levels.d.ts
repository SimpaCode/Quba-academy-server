/**
 * src/routes/levels/levels.ts
 *
 * GET /api/levels?plan=pro|team
 *
 * Direct port of app/api/levels/route.ts.
 * Heavy mission fields (markdownContent, checkpoint, solution) are
 * stripped at the DB query level — same as the Next.js version.
 */
import { Request, Response } from "express";
export declare function getLevels(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=levels.d.ts.map