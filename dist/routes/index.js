"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = __importDefault(require("./levels/index"));
const index_2 = __importDefault(require("./user/index"));
// import adminRouter from "./admin/index";
const index_3 = __importDefault(require("./ai/index"));
const router = (0, express_1.Router)();
router.use("/levels", index_1.default);
router.use("/user", index_2.default);
// router.use("/admin", adminRouter);
router.use("/ai", index_3.default);
exports.default = router;
//# sourceMappingURL=index.js.map