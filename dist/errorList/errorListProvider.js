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
exports.ErrorListProvider = exports.ErrorListItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class ErrorListItem extends vscode.TreeItem {
    diagnostic;
    uri;
    constructor(uri, diagnostic) {
        const severityStr = diagnostic.severity === vscode.DiagnosticSeverity.Error
            ? 'Error'
            : diagnostic.severity === vscode.DiagnosticSeverity.Warning
                ? 'Warning'
                : 'Message';
        const codeStr = diagnostic.code ? `[${diagnostic.code}] ` : '';
        const label = `${codeStr}${diagnostic.message}`;
        super(label, vscode.TreeItemCollapsibleState.None);
        this.uri = uri;
        this.diagnostic = diagnostic;
        const line = diagnostic.range.start.line + 1;
        const col = diagnostic.range.start.character + 1;
        this.description = `${path.basename(uri.fsPath)} (line ${line}, col ${col})`;
        if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
            this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        }
        else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        }
        else {
            this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
        }
        this.tooltip = `${severityStr}: ${diagnostic.message}\nFile: ${uri.fsPath}:${line}:${col}`;
        this.command = {
            command: 'vscode.open',
            title: 'Go to Error',
            arguments: [
                uri,
                {
                    selection: diagnostic.range
                }
            ]
        };
    }
}
exports.ErrorListItem = ErrorListItem;
class ErrorListProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor() {
        vscode.languages.onDidChangeDiagnostics(() => {
            this._onDidChangeTreeData.fire();
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        const items = [];
        const allDiagnostics = vscode.languages.getDiagnostics();
        for (const [uri, diagnostics] of allDiagnostics) {
            // Filter for C# or project files in workspace
            for (const diag of diagnostics) {
                items.push(new ErrorListItem(uri, diag));
            }
        }
        // Sort: errors first, then warnings, then info
        items.sort((a, b) => a.diagnostic.severity - b.diagnostic.severity);
        return Promise.resolve(items);
    }
}
exports.ErrorListProvider = ErrorListProvider;
//# sourceMappingURL=errorListProvider.js.map