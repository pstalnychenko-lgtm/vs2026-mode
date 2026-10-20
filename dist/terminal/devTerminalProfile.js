"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevTerminalProfile = void 0;
const vscode = __importStar(require("vscode"));
class DevTerminalProfile {
    static terminalInstance;
    static open() {
        if (this.terminalInstance && this.terminalInstance.exitStatus === undefined) {
            this.terminalInstance.show();
            return this.terminalInstance;
        }
        const isWin = process.platform === 'win32';
        const env = {
            DOTNET_CLI_TELEMETRY_OPTOUT: '1',
            VS_MODE: '2026'
        };
        if (!isWin) {
            env.PATH = `/opt/homebrew/bin:/opt/homebrew/opt/openjdk/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}`;
        }
        this.terminalInstance = vscode.window.createTerminal({
            name: 'Developer Terminal (VS 2026)',
            message: 'Visual Studio 2026 Developer Terminal Initialized.\nType "dotnet --info" or "dotnet build" to work with projects.\n',
            env
        });
        this.terminalInstance.show();
        return this.terminalInstance;
    }
}
exports.DevTerminalProfile = DevTerminalProfile;
//# sourceMappingURL=devTerminalProfile.js.map