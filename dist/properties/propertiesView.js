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
exports.PropertiesViewProvider = exports.PropertyTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PropertyTreeItem extends vscode.TreeItem {
    entry;
    constructor(entry, isCategory = false) {
        this.entry = entry;
        if (isCategory) {
            super(entry.category, vscode.TreeItemCollapsibleState.Expanded);
            this.iconPath = new vscode.ThemeIcon('list-tree');
        }
        else {
            super(`${entry.key}: ${entry.value}`, vscode.TreeItemCollapsibleState.None);
            this.description = entry.key;
            this.label = entry.value;
            this.tooltip = `${entry.category} -> ${entry.key}: ${entry.value}`;
            this.iconPath = new vscode.ThemeIcon('symbol-property');
        }
    }
}
exports.PropertyTreeItem = PropertyTreeItem;
class PropertiesViewProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    currentTargetUri;
    currentProperties = [];
    constructor() {
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.inspectUri(editor.document.uri);
            }
        });
        if (vscode.window.activeTextEditor) {
            this.inspectUri(vscode.window.activeTextEditor.document.uri);
        }
    }
    inspectUri(uri) {
        this.currentTargetUri = uri;
        this.computeProperties(uri.fsPath);
        this._onDidChangeTreeData.fire();
    }
    inspectProject(projectName, projectPath, framework) {
        this.currentProperties = [
            { category: 'Project Properties', key: 'Project Name', value: projectName },
            { category: 'Project Properties', key: 'Project Path', value: projectPath },
            { category: 'Project Properties', key: 'Target Framework', value: framework || 'Auto-detected' },
            { category: 'Build', key: 'Default Configuration', value: 'Debug' },
            { category: 'Build', key: 'Platform', value: 'Any CPU' }
        ];
        this._onDidChangeTreeData.fire();
    }
    async computeProperties(filePath) {
        try {
            const stat = await fs.promises.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const fileName = path.basename(filePath);
            let fileType = 'Generic File';
            let buildAction = 'Content';
            if (ext === '.cs') {
                fileType = 'C# Source Code';
                buildAction = 'Compile';
            }
            else if (ext === '.py') {
                fileType = 'Python Script / Module';
                buildAction = 'Execute';
            }
            else if (ext === '.java') {
                fileType = 'Java Source File';
                buildAction = 'Compile (javac)';
            }
            else if (ext === '.cpp' || ext === '.cc') {
                fileType = 'C++ Source File';
                buildAction = 'Compile (clang/gcc/msvc)';
            }
            else if (ext === '.h' || ext === '.hpp') {
                fileType = 'C/C++ Header File';
                buildAction = 'Header';
            }
            else if (ext === '.ts' || ext === '.tsx') {
                fileType = 'TypeScript File';
                buildAction = 'Transpile';
            }
            else if (ext === '.sln' || ext === '.slnx') {
                fileType = 'Visual Studio Solution';
                buildAction = 'Solution Manifest';
            }
            else if (ext === '.csproj') {
                fileType = 'C# MSBuild Project';
                buildAction = 'Project';
            }
            const sizeStr = stat.size > 1024 ? `${(stat.size / 1024).toFixed(1)} KB` : `${stat.size} bytes`;
            this.currentProperties = [
                { category: 'File Properties', key: 'File Name', value: fileName },
                { category: 'File Properties', key: 'Item Type', value: fileType },
                { category: 'File Properties', key: 'Size', value: sizeStr },
                { category: 'Advanced', key: 'Build Action', value: buildAction },
                { category: 'Advanced', key: 'Copy to Output Directory', value: 'Do not copy' },
                { category: 'Location', key: 'Full Path', value: filePath },
                { category: 'Location', key: 'Last Modified', value: stat.mtime.toLocaleString() }
            ];
        }
        catch {
            this.currentProperties = [
                { category: 'General', key: 'Status', value: 'No selection or file not found' }
            ];
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Group by categories
            const categories = Array.from(new Set(this.currentProperties.map(p => p.category)));
            if (categories.length === 0) {
                return Promise.resolve([
                    new PropertyTreeItem({ category: 'Properties', key: 'Select item in Solution Explorer', value: '' })
                ]);
            }
            return Promise.resolve(categories.map(cat => new PropertyTreeItem({ category: cat, key: '', value: '' }, true)));
        }
        // Children of category
        const items = this.currentProperties
            .filter(p => p.category === element.entry.category)
            .map(p => new PropertyTreeItem(p, false));
        return Promise.resolve(items);
    }
}
exports.PropertiesViewProvider = PropertiesViewProvider;
//# sourceMappingURL=propertiesView.js.map