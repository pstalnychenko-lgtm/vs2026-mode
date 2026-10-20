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
exports.SolutionTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class SolutionTreeItem extends vscode.TreeItem {
    itemType;
    filePath;
    projectPath;
    packageVersion;
    constructor(label, itemType, collapsibleState = vscode.TreeItemCollapsibleState.None, options) {
        super(label, collapsibleState);
        this.itemType = itemType;
        this.filePath = options?.filePath;
        this.projectPath = options?.projectPath;
        this.packageVersion = options?.packageVersion;
        this.contextValue = itemType;
        if (options?.description) {
            this.description = options.description;
        }
        this.assignIconAndCommand();
    }
    assignIconAndCommand() {
        switch (this.itemType) {
            case 'solution':
                this.iconPath = new vscode.ThemeIcon('repo');
                this.tooltip = `Solution: ${this.label}`;
                break;
            case 'project':
                this.iconPath = new vscode.ThemeIcon('symbol-class');
                this.tooltip = `C# Project: ${this.label} (${this.projectPath})`;
                break;
            case 'dependencies':
                this.iconPath = new vscode.ThemeIcon('package');
                this.tooltip = 'Project Dependencies';
                break;
            case 'packages-folder':
                this.iconPath = new vscode.ThemeIcon('layers');
                this.tooltip = 'Installed NuGet Packages';
                break;
            case 'package-item':
                this.iconPath = new vscode.ThemeIcon('cloud-download');
                this.tooltip = `NuGet: ${this.label}`;
                break;
            case 'projects-folder':
                this.iconPath = new vscode.ThemeIcon('references');
                this.tooltip = 'Referenced Projects';
                break;
            case 'project-ref-item':
                this.iconPath = new vscode.ThemeIcon('link');
                this.tooltip = `Project Reference: ${this.label}`;
                break;
            case 'folder':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'file':
                if (this.filePath) {
                    this.resourceUri = vscode.Uri.file(this.filePath);
                    if (this.filePath.endsWith('.cs')) {
                        this.iconPath = new vscode.ThemeIcon('file-code');
                    }
                    else if (this.filePath.endsWith('.json')) {
                        this.iconPath = new vscode.ThemeIcon('json');
                    }
                    else {
                        this.iconPath = new vscode.ThemeIcon('file');
                    }
                    this.command = {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [vscode.Uri.file(this.filePath)]
                    };
                }
                break;
        }
    }
}
exports.SolutionTreeItem = SolutionTreeItem;
//# sourceMappingURL=solutionTreeItem.js.map