import * as vscode from 'vscode';
import * as path from 'path';

export class ErrorListItem extends vscode.TreeItem {
  public diagnostic: vscode.Diagnostic;
  public uri: vscode.Uri;

  constructor(uri: vscode.Uri, diagnostic: vscode.Diagnostic) {
    const severityStr =
      diagnostic.severity === vscode.DiagnosticSeverity.Error
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
    } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
      this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
    } else {
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

export class ErrorListProvider implements vscode.TreeDataProvider<ErrorListItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ErrorListItem | undefined | void> =
    new vscode.EventEmitter<ErrorListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ErrorListItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    vscode.languages.onDidChangeDiagnostics(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: ErrorListItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: ErrorListItem): Thenable<ErrorListItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const items: ErrorListItem[] = [];
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
