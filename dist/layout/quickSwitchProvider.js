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
exports.QuickSwitchProvider = exports.QuickSwitchItem = void 0;
const vscode = __importStar(require("vscode"));
class QuickSwitchItem extends vscode.TreeItem {
    constructor(label, description, icon, commandId, tooltip, color) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon);
        this.tooltip = tooltip;
        this.command = {
            command: commandId,
            title: label
        };
    }
}
exports.QuickSwitchItem = QuickSwitchItem;
class QuickSwitchProvider {
    layoutManager;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(layoutManager) {
        this.layoutManager = layoutManager;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        const isActive = this.layoutManager.isModeActive();
        const items = [];
        // Main Toggle Button
        if (isActive) {
            items.push(new QuickSwitchItem('🟣 VS 2026 Mode: ON', '[Click to switch to VS Code]', 'arrow-swap', 'vs2026.toggleMode', 'Click to return to standard VS Code layout (Sidebar on Left, default theme)'));
        }
        else {
            items.push(new QuickSwitchItem('⚪ VS 2026 Mode: OFF', '[Click to switch to VS 2026]', 'arrow-swap', 'vs2026.toggleMode', 'Click to activate Visual Studio 2026 layout (Sidebar on Right, VS 2026 theme)'));
        }
        // Green Start Button
        items.push(new QuickSwitchItem('▶ Start Project (F5)', 'Run / Debug', 'play', 'vs2026.startDebugging', 'Start Debugging or Run the Project'));
        // Quick Action: Start Window
        items.push(new QuickSwitchItem('🏠 Create New Project / Start', 'Console App, Clean App, Web API...', 'home', 'vs2026.openStartWindow', 'Open Visual Studio 2026 Start Window'));
        // Quick Action: Hot Reload
        items.push(new QuickSwitchItem('🔥 Hot Reload (Live Code)', 'Live Watcher Session', 'flame', 'vs2026.toggleHotReload', 'Toggle Visual Studio 2026 Hot Reload'));
        // Quick Action: Build
        items.push(new QuickSwitchItem('⚙ Build Solution / Project', 'Ctrl+Shift+B', 'gear', 'vs2026.buildSolution', 'Build the current solution or project'));
        return Promise.resolve(items);
    }
}
exports.QuickSwitchProvider = QuickSwitchProvider;
//# sourceMappingURL=quickSwitchProvider.js.map