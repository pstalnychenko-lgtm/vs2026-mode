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
exports.HotReloadService = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
class HotReloadService {
    static instance;
    watchProcess;
    isWatching = false;
    outputChannel;
    statusBarItem;
    static getInstance(context) {
        if (!HotReloadService.instance) {
            HotReloadService.instance = new HotReloadService(context);
        }
        return HotReloadService.instance;
    }
    constructor(context) {
        this.outputChannel = vscode.window.createOutputChannel('Visual Studio 2026 Hot Reload');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.text = '$(flame) Hot Reload';
        this.statusBarItem.tooltip = 'Click to Toggle Visual Studio 2026 Hot Reload (Live Code Editing)';
        this.statusBarItem.command = 'vs2026.toggleHotReload';
        this.statusBarItem.show();
        context.subscriptions.push(this.outputChannel, this.statusBarItem);
    }
    async toggle(projectPath) {
        if (this.isWatching) {
            this.stop();
        }
        else {
            await this.start(projectPath);
        }
    }
    async start(projectPath) {
        if (this.isWatching) {
            vscode.window.showInformationMessage('Hot Reload is already active.');
            return;
        }
        let target = projectPath;
        if (!target) {
            const csproj = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 1);
            if (csproj.length > 0) {
                target = csproj[0].fsPath;
            }
        }
        this.outputChannel.clear();
        this.outputChannel.show(true);
        this.outputChannel.appendLine('========================================');
        this.outputChannel.appendLine('[Hot Reload 🔥] Starting Live Watcher Session...');
        this.outputChannel.appendLine(`[Hot Reload 🔥] Target: ${target || 'Current Workspace'}`);
        this.outputChannel.appendLine('========================================\n');
        const cwd = vscode.workspace.rootPath || process.cwd();
        const args = target ? ['watch', '--project', target] : ['watch'];
        try {
            this.watchProcess = (0, child_process_1.spawn)('dotnet', args, { cwd, shell: true });
            this.isWatching = true;
            this.statusBarItem.text = '$(flame) Hot Reload: Active';
            this.statusBarItem.color = '#FFA500'; // Orange fire accent
            this.watchProcess.stdout?.on('data', data => {
                const str = data.toString();
                this.outputChannel.append(str);
                if (str.includes('Hot reload') || str.includes('Building') || str.includes('File changed')) {
                    vscode.window.setStatusBarMessage('$(check) Hot Reload applied changes successfully.', 3000);
                }
            });
            this.watchProcess.stderr?.on('data', data => {
                this.outputChannel.append(`[ERR] ${data.toString()}`);
            });
            this.watchProcess.on('close', code => {
                this.isWatching = false;
                this.statusBarItem.text = '$(flame) Hot Reload';
                this.statusBarItem.color = undefined;
                this.outputChannel.appendLine(`\n[Hot Reload 🔥] Session terminated with code ${code}.`);
            });
            vscode.window.showInformationMessage('Visual Studio 2026: Hot Reload (🔥) session started!');
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to start Hot Reload: ${err.message}`);
        }
    }
    stop() {
        if (this.watchProcess) {
            this.watchProcess.kill();
            this.watchProcess = undefined;
        }
        this.isWatching = false;
        this.statusBarItem.text = '$(flame) Hot Reload';
        this.statusBarItem.color = undefined;
        this.outputChannel.appendLine('\n[Hot Reload 🔥] Stopped by user.');
        vscode.window.showInformationMessage('Visual Studio 2026: Hot Reload stopped.');
    }
}
exports.HotReloadService = HotReloadService;
//# sourceMappingURL=hotReloadService.js.map