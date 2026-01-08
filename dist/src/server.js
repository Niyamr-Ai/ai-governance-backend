"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const PORT = process.env.PORT || 3001;
app_1.default.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
});
exports.default = app_1.default;
//# sourceMappingURL=server.js.map