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
exports.TestExplorerProvider = exports.TestTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
class TestTreeItem extends vscode.TreeItem {
    testName;
    status;
    projectPath;
    durationMs;
    constructor(testName, status = 'not_run', projectPath, durationMs) {
        super(testName, vscode.TreeItemCollapsibleState.None);
        this.testName = testName;
        this.status = status;
        this.projectPath = projectPath;
        this.durationMs = durationMs;
        this.updateStatus(status);
    }
    updateStatus(status, durationMs) {
        this.status = status;
        this.durationMs = durationMs;
        if (durationMs !== undefined) {
            this.description = `${durationMs}ms`;
        }
        switch (status) {
            case 'passed':
                this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
                this.tooltip = `Passed: ${this.testName} (${durationMs || 0}ms)`;
                break;
            case 'failed':
                this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
                this.tooltip = `Failed: ${this.testName}`;
                break;
            case 'running':
                this.iconPath = new vscode.ThemeIcon('loading~spin');
                this.tooltip = `Running: ${this.testName}`;
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-outline');
                this.tooltip = `Not Run: ${this.testName}`;
                break;
        }
    }
}
exports.TestTreeItem = TestTreeItem;
class TestExplorerProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    tests = [];
    outputChannel;
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Visual Studio 2026 Test Runner');
        this.discoverTests();
    }
    refresh() {
        this.discoverTests();
        this._onDidChangeTreeData.fire();
    }
    async discoverTests() {
        this.tests = [];
        // Check for C# test files
        const csFiles = await vscode.workspace.findFiles('**/*Test*.cs', '**/node_modules/**', 20);
        for (const f of csFiles) {
            const name = path.basename(f.fsPath, '.cs');
            this.tests.push(new TestTreeItem(name, 'not_run', f.fsPath));
        }
        // Check for Python test files
        const pyFiles = await vscode.workspace.findFiles('**/test_*.py', '**/node_modules/**', 20);
        for (const f of pyFiles) {
            const name = path.basename(f.fsPath, '.py');
            this.tests.push(new TestTreeItem(name, 'not_run', f.fsPath));
        }
        if (this.tests.length === 0) {
            this.tests.push(new TestTreeItem('No tests found in solution', 'not_run'));
        }
        this._onDidChangeTreeData.fire();
    }
    async runAllTests() {
        this.outputChannel.clear();
        this.outputChannel.show(true);
        this.outputChannel.appendLine('========================================');
        this.outputChannel.appendLine('Visual Studio 2026 Test Explorer: Run All Tests');
        this.outputChannel.appendLine('========================================\n');
        for (const t of this.tests) {
            if (t.projectPath) {
                t.updateStatus('running');
            }
        }
        this._onDidChangeTreeData.fire();
        const cwd = vscode.workspace.rootPath || process.cwd();
        const startTime = Date.now();
        // Check if C# or Python
        const hasCsharp = this.tests.some(t => t.projectPath?.endsWith('.cs'));
        const cmd = hasCsharp ? 'dotnet test --logger "console;verbosity=normal"' : 'pytest';
        (0, child_process_1.exec)(cmd, { cwd }, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;
            this.outputChannel.append(stdout);
            if (stderr) {
                this.outputChannel.append(stderr);
            }
            const passed = !error;
            for (const t of this.tests) {
                if (t.projectPath) {
                    t.updateStatus(passed ? 'passed' : 'failed', Math.round(duration / Math.max(1, this.tests.length)));
                }
            }
            this._onDidChangeTreeData.fire();
            if (passed) {
                vscode.window.showInformationMessage(`All tests passed successfully in ${duration}ms!`);
            }
            else {
                vscode.window.showErrorMessage('Some tests failed. Check Test Output window.');
            }
        });
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        return Promise.resolve(this.tests);
    }
}
exports.TestExplorerProvider = TestExplorerProvider;
//# sourceMappingURL=testExplorerProvider.js.map