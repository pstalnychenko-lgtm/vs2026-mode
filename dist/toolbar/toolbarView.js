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
exports.ToolbarView = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class ToolbarView {
    modeItem;
    startWindowItem;
    buildItem;
    configItem;
    startupItem;
    runItem;
    publishItem;
    currentConfiguration = 'Debug';
    currentStartupProject;
    constructor(context) {
        // Mode Switcher Button
        this.modeItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 107);
        this.modeItem.text = '$(layout-sidebar-right) 🟣 VS 2026';
        this.modeItem.tooltip = 'Click to Toggle Visual Studio 2026 Mode On/Off';
        this.modeItem.command = 'vs2026.toggleMode';
        this.modeItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        context.subscriptions.push(this.modeItem);
        // VS 2026 Start Window Home Button
        this.startWindowItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 106);
        this.startWindowItem.text = '$(home) VS 2026 Start';
        this.startWindowItem.tooltip = 'Open Visual Studio 2026 Start Window (Recent Projects & Create New)';
        this.startWindowItem.command = 'vs2026.openStartWindow';
        context.subscriptions.push(this.startWindowItem);
        // Build Solution button
        this.buildItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 105);
        this.buildItem.text = '$(gear) Build';
        this.buildItem.tooltip = 'Build Solution / Project (Ctrl+Shift+B)';
        this.buildItem.command = 'vs2026.buildSolution';
        context.subscriptions.push(this.buildItem);
        // Configuration selector (Debug / Release)
        this.configItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 104);
        this.configItem.text = `[ ${this.currentConfiguration} | Any CPU ]`;
        this.configItem.tooltip = 'Click to switch between Debug and Release configuration';
        this.configItem.command = 'vs2026.toggleConfiguration';
        context.subscriptions.push(this.configItem);
        // Startup Project Selector
        this.startupItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 103);
        this.startupItem.text = '$(rocket) Startup Project';
        this.startupItem.tooltip = 'Select Startup Project for debugging / running';
        this.startupItem.command = 'vs2026.selectStartupProject';
        context.subscriptions.push(this.startupItem);
        // Start / Run (Green arrow)
        this.runItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 102);
        this.runItem.text = '$(play) Start';
        this.runItem.tooltip = 'Start Debugging / Run Application (F5)';
        this.runItem.command = 'vs2026.startDebugging';
        this.runItem.color = '#22C55E'; // Vibrant Green matching VS 2026 Start button
        context.subscriptions.push(this.runItem);
        // Publish Button
        this.publishItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 101);
        this.publishItem.text = '$(cloud-upload) Publish';
        this.publishItem.tooltip = 'Visual Studio 2026 Publish & Deployment Wizard';
        this.publishItem.command = 'vs2026.publishProject';
        context.subscriptions.push(this.publishItem);
        // Watch active editor to adapt toolbar for Python, Java, C#, JS/TS
        vscode.window.onDidChangeActiveTextEditor(editor => {
            this.adaptForEditor(editor);
        });
        this.adaptForEditor(vscode.window.activeTextEditor);
        this.showAll();
    }
    adaptForEditor(editor) {
        if (!editor)
            return;
        const ext = path.extname(editor.document.fileName).toLowerCase();
        if (ext === '.py') {
            this.runItem.text = '$(play) Run Python';
            this.runItem.tooltip = 'Execute active Python script';
            this.configItem.text = '[ 🐍 Python ]';
        }
        else if (ext === '.go') {
            this.runItem.text = '$(play) Run Go';
            this.runItem.tooltip = 'Execute active Go file/package (go run)';
            this.configItem.text = '[ 🐹 Go ]';
        }
        else if (ext === '.java') {
            this.runItem.text = '$(play) Run Java';
            this.runItem.tooltip = 'Execute Java class';
            this.configItem.text = '[ ☕ Java ]';
        }
        else if (['.cpp', '.cc', '.cxx', '.c'].includes(ext)) {
            this.runItem.text = '$(play) Start C/C++';
            this.configItem.text = '[ C/C++ | clang++ ]';
        }
        else if (ext === '.rs') {
            this.runItem.text = '$(play) Run Rust';
            this.runItem.tooltip = 'Execute active Rust binary (cargo run)';
            this.configItem.text = '[ 🦀 Rust ]';
        }
        else if (ext === '.swift') {
            this.runItem.text = '$(play) Run Swift';
            this.runItem.tooltip = 'Execute active Swift script / package (swift run)';
            this.configItem.text = '[ 🦅 Swift ]';
        }
        else if (ext === '.ts' || ext === '.js') {
            this.runItem.text = '$(play) Run Node/TS';
            this.configItem.text = '[ 📦 Node.js ]';
        }
        else {
            this.runItem.text = '$(play) Start';
            this.configItem.text = `[ ${this.currentConfiguration} | Any CPU ]`;
        }
    }
    showAll() {
        this.modeItem.show();
        this.startWindowItem.show();
        this.buildItem.show();
        this.configItem.show();
        this.startupItem.show();
        this.runItem.show();
        this.publishItem.show();
    }
    hideAll() {
        this.modeItem.hide();
        this.startWindowItem.hide();
        this.buildItem.hide();
        this.configItem.hide();
        this.startupItem.hide();
        this.runItem.hide();
        this.publishItem.hide();
    }
    setConfiguration(config) {
        this.currentConfiguration = config;
        this.configItem.text = `[ ${this.currentConfiguration} | Any CPU ]`;
    }
    getConfiguration() {
        return this.currentConfiguration;
    }
    setStartupProject(projectPath) {
        this.currentStartupProject = projectPath;
        const projName = path.basename(projectPath, path.extname(projectPath));
        this.startupItem.text = `$(rocket) ${projName}`;
        this.startupItem.tooltip = `Startup Project: ${projName} (${projectPath})`;
    }
    getStartupProject() {
        return this.currentStartupProject;
    }
    async toggleConfiguration() {
        const picked = await vscode.window.showQuickPick(['Debug', 'Release'], {
            placeHolder: 'Select Solution Configuration'
        });
        if (picked) {
            this.setConfiguration(picked);
            vscode.window.showInformationMessage(`Visual Studio 2026: Configuration set to ${picked}`);
        }
    }
    async selectStartupProject() {
        const files = await vscode.workspace.findFiles('**/*.{csproj,py,java,cpp}', '**/node_modules/**', 20);
        if (files.length === 0) {
            vscode.window.showWarningMessage('No project or source files found in workspace.');
            return;
        }
        const picks = files.map(uri => ({
            label: path.basename(uri.fsPath),
            description: path.relative(vscode.workspace.rootPath || '', uri.fsPath),
            uri
        }));
        const selected = await vscode.window.showQuickPick(picks, {
            placeHolder: 'Select Startup Target'
        });
        if (selected) {
            this.setStartupProject(selected.uri.fsPath);
            vscode.window.showInformationMessage(`Visual Studio 2026: Startup target set to '${selected.label}'`);
        }
    }
}
exports.ToolbarView = ToolbarView;
//# sourceMappingURL=toolbarView.js.map