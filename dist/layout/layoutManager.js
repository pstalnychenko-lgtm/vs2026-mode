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
exports.LayoutManager = void 0;
const vscode = __importStar(require("vscode"));
class LayoutManager {
    static PREV_SIDEBAR_KEY = 'vs2026.prevSidebarLocation';
    static PREV_THEME_KEY = 'vs2026.prevTheme';
    static IS_ACTIVE_KEY = 'vs2026.isModeActive';
    context;
    statusBarItem;
    constructor(context) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 110);
        this.statusBarItem.command = 'vs2026.toggleMode';
        this.context.subscriptions.push(this.statusBarItem);
    }
    async initialize() {
        const isCSharpWorkspace = await this.detectCSharpWorkspace();
        const config = vscode.workspace.getConfiguration('vs2026');
        const autoSwitch = config.get('autoSwitchOnCSharp', true);
        const wasActive = this.context.globalState.get(LayoutManager.IS_ACTIVE_KEY, false);
        if ((isCSharpWorkspace && autoSwitch) || wasActive) {
            await this.enableVS2026Mode(false);
        }
        else {
            this.updateStatusBar(false);
        }
    }
    async detectCSharpWorkspace() {
        const slnFiles = await vscode.workspace.findFiles('**/*.{sln,slnx}', '**/node_modules/**', 1);
        if (slnFiles.length > 0) {
            return true;
        }
        const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 1);
        if (csprojFiles.length > 0) {
            return true;
        }
        // Also detect Python, Java, or C++ projects
        const pyFiles = await vscode.workspace.findFiles('**/{requirements.txt,pyproject.toml}', '**/node_modules/**', 1);
        if (pyFiles.length > 0) {
            return true;
        }
        const javaFiles = await vscode.workspace.findFiles('**/{pom.xml,build.gradle}', '**/node_modules/**', 1);
        return javaFiles.length > 0;
    }
    isModeActive() {
        return this.context.globalState.get(LayoutManager.IS_ACTIVE_KEY, false);
    }
    async toggleMode() {
        if (this.isModeActive()) {
            await this.disableVS2026Mode(true);
        }
        else {
            await this.enableVS2026Mode(true);
        }
    }
    async enableVS2026Mode(notify = true) {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        // Save current settings for restoration
        const currentSidebar = workbenchConfig.get('sideBar.location', 'left');
        const currentTheme = workbenchConfig.get('colorTheme', 'Default Dark Modern');
        if (!this.isModeActive()) {
            await this.context.globalState.update(LayoutManager.PREV_SIDEBAR_KEY, currentSidebar);
            await this.context.globalState.update(LayoutManager.PREV_THEME_KEY, currentTheme);
        }
        // Apply Visual Studio 2026 layout
        try {
            await workbenchConfig.update('sideBar.location', 'right', vscode.ConfigurationTarget.Global);
            await workbenchConfig.update('colorTheme', 'Visual Studio 2026 Dark', vscode.ConfigurationTarget.Global);
        }
        catch (err) {
            console.warn('Could not update workbench settings directly:', err);
        }
        await this.context.globalState.update(LayoutManager.IS_ACTIVE_KEY, true);
        await vscode.commands.executeCommand('setContext', 'vs2026:active', true);
        this.updateStatusBar(true);
        if (notify) {
            vscode.window.showInformationMessage('Visual Studio 2026 Mode Activated: Solution Explorer on the right, VS 2026 Theme & Shortcuts enabled.');
        }
    }
    async disableVS2026Mode(notify = true) {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        const prevSidebar = this.context.globalState.get(LayoutManager.PREV_SIDEBAR_KEY, 'left');
        const prevTheme = this.context.globalState.get(LayoutManager.PREV_THEME_KEY, 'Default Dark Modern');
        try {
            await workbenchConfig.update('sideBar.location', prevSidebar, vscode.ConfigurationTarget.Global);
            await workbenchConfig.update('colorTheme', prevTheme, vscode.ConfigurationTarget.Global);
        }
        catch (err) {
            console.warn('Could not restore workbench settings:', err);
        }
        await this.context.globalState.update(LayoutManager.IS_ACTIVE_KEY, false);
        await vscode.commands.executeCommand('setContext', 'vs2026:active', false);
        this.updateStatusBar(false);
        if (notify) {
            vscode.window.showInformationMessage('Visual Studio 2026 Mode Deactivated. Standard VS Code layout restored.');
        }
    }
    updateStatusBar(active) {
        if (active) {
            this.statusBarItem.text = '$(layout-sidebar-right) 🟣 [VS 2026: ON]';
            this.statusBarItem.tooltip = 'Visual Studio 2026 Mode is Active. Click to switch back to standard VS Code layout.';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            this.statusBarItem.text = '$(layout-sidebar-left) ⚪ [VS 2026: OFF]';
            this.statusBarItem.tooltip = 'Visual Studio 2026 Mode is Inactive. Click to switch to Visual Studio 2026 layout.';
            this.statusBarItem.backgroundColor = undefined;
        }
        this.statusBarItem.show();
    }
}
exports.LayoutManager = LayoutManager;
//# sourceMappingURL=layoutManager.js.map