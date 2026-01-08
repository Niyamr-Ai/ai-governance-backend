import { Request, Response, NextFunction } from "express";
/** Express error handler middleware */
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
/** Higher-order function to wrap async route handlers */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.d.ts.map