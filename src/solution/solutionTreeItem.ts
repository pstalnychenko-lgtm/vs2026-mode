import * as vscode from 'vscode';
import * as path from 'path';

export type ItemType =
  | 'solution'
  | 'project'
  | 'dependencies'
  | 'packages-folder'
  | 'package-item'
  | 'projects-folder'
  | 'project-ref-item'
  | 'folder'
  | 'file';

export class SolutionTreeItem extends vscode.TreeItem {
  public itemType: ItemType;
  public filePath?: string;
  public projectPath?: string;
  public packageVersion?: string;

  constructor(
    label: string,
    itemType: ItemType,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    options?: {
      filePath?: string;
      projectPath?: string;
      description?: string;
      packageVersion?: string;
    }
  ) {
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

  private assignIconAndCommand(): void {
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
          } else if (this.filePath.endsWith('.json')) {
            this.iconPath = new vscode.ThemeIcon('json');
          } else {
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
