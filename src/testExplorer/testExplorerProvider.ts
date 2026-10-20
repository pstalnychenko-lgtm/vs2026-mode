import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

export type TestStatus = 'not_run' | 'passed' | 'failed' | 'running';

export class TestTreeItem extends vscode.TreeItem {
  constructor(
    public readonly testName: string,
    public status: TestStatus = 'not_run',
    public readonly projectPath?: string,
    public durationMs?: number
  ) {
    super(testName, vscode.TreeItemCollapsibleState.None);
    this.updateStatus(status);
  }

  public updateStatus(status: TestStatus, durationMs?: number): void {
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

export class TestExplorerProvider implements vscode.TreeDataProvider<TestTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TestTreeItem | undefined | void> =
    new vscode.EventEmitter<TestTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TestTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private tests: TestTreeItem[] = [];
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Visual Studio 2026 Test Runner');
    this.discoverTests();
  }

  public refresh(): void {
    this.discoverTests();
    this._onDidChangeTreeData.fire();
  }

  public async discoverTests(): Promise<void> {
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

  public async runAllTests(): Promise<void> {
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

    exec(cmd, { cwd }, (error, stdout, stderr) => {
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
      } else {
        vscode.window.showErrorMessage('Some tests failed. Check Test Output window.');
      }
    });
  }

  public getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: TestTreeItem): Thenable<TestTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }
    return Promise.resolve(this.tests);
  }
}
