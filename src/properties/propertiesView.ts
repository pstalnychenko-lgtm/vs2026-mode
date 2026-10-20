import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface PropertyEntry {
  category: string;
  key: string;
  value: string;
}

export class PropertyTreeItem extends vscode.TreeItem {
  constructor(public entry: PropertyEntry, isCategory: boolean = false) {
    if (isCategory) {
      super(entry.category, vscode.TreeItemCollapsibleState.Expanded);
      this.iconPath = new vscode.ThemeIcon('list-tree');
    } else {
      super(`${entry.key}: ${entry.value}`, vscode.TreeItemCollapsibleState.None);
      this.description = entry.key;
      this.label = entry.value;
      this.tooltip = `${entry.category} -> ${entry.key}: ${entry.value}`;
      this.iconPath = new vscode.ThemeIcon('symbol-property');
    }
  }
}

export class PropertiesViewProvider implements vscode.TreeDataProvider<PropertyTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PropertyTreeItem | undefined | void> =
    new vscode.EventEmitter<PropertyTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<PropertyTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private currentTargetUri?: vscode.Uri;
  private currentProperties: PropertyEntry[] = [];

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

  public inspectUri(uri: vscode.Uri): void {
    this.currentTargetUri = uri;
    this.computeProperties(uri.fsPath);
    this._onDidChangeTreeData.fire();
  }

  public inspectProject(projectName: string, projectPath: string, framework?: string): void {
    this.currentProperties = [
      { category: 'Project Properties', key: 'Project Name', value: projectName },
      { category: 'Project Properties', key: 'Project Path', value: projectPath },
      { category: 'Project Properties', key: 'Target Framework', value: framework || 'Auto-detected' },
      { category: 'Build', key: 'Default Configuration', value: 'Debug' },
      { category: 'Build', key: 'Platform', value: 'Any CPU' }
    ];
    this._onDidChangeTreeData.fire();
  }

  private async computeProperties(filePath: string): Promise<void> {
    try {
      const stat = await fs.promises.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);

      let fileType = 'Generic File';
      let buildAction = 'Content';

      if (ext === '.cs') {
        fileType = 'C# Source Code';
        buildAction = 'Compile';
      } else if (ext === '.py') {
        fileType = 'Python Script / Module';
        buildAction = 'Execute';
      } else if (ext === '.java') {
        fileType = 'Java Source File';
        buildAction = 'Compile (javac)';
      } else if (ext === '.cpp' || ext === '.cc') {
        fileType = 'C++ Source File';
        buildAction = 'Compile (clang/gcc/msvc)';
      } else if (ext === '.h' || ext === '.hpp') {
        fileType = 'C/C++ Header File';
        buildAction = 'Header';
      } else if (ext === '.ts' || ext === '.tsx') {
        fileType = 'TypeScript File';
        buildAction = 'Transpile';
      } else if (ext === '.sln' || ext === '.slnx') {
        fileType = 'Visual Studio Solution';
        buildAction = 'Solution Manifest';
      } else if (ext === '.csproj') {
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
    } catch {
      this.currentProperties = [
        { category: 'General', key: 'Status', value: 'No selection or file not found' }
      ];
    }
  }

  public getTreeItem(element: PropertyTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: PropertyTreeItem): Thenable<PropertyTreeItem[]> {
    if (!element) {
      // Group by categories
      const categories = Array.from(new Set(this.currentProperties.map(p => p.category)));
      if (categories.length === 0) {
        return Promise.resolve([
          new PropertyTreeItem({ category: 'Properties', key: 'Select item in Solution Explorer', value: '' })
        ]);
      }
      return Promise.resolve(
        categories.map(cat => new PropertyTreeItem({ category: cat, key: '', value: '' }, true))
      );
    }

    // Children of category
    const items = this.currentProperties
      .filter(p => p.category === element.entry.category)
      .map(p => new PropertyTreeItem(p, false));

    return Promise.resolve(items);
  }
}
