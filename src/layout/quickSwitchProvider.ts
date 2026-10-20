import * as vscode from 'vscode';
import { LayoutManager } from './layoutManager';

export class QuickSwitchItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    commandId: string,
    tooltip: string,
    color?: string
  ) {
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

export class QuickSwitchProvider implements vscode.TreeDataProvider<QuickSwitchItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<QuickSwitchItem | undefined | void> =
    new vscode.EventEmitter<QuickSwitchItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<QuickSwitchItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private layoutManager: LayoutManager) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: QuickSwitchItem): vscode.TreeItem {
    return element;
  }

  public getChildren(): Thenable<QuickSwitchItem[]> {
    const isActive = this.layoutManager.isModeActive();

    const items: QuickSwitchItem[] = [];

    // Main Toggle Button
    if (isActive) {
      items.push(
        new QuickSwitchItem(
          '🟣 VS 2026 Mode: ON',
          '[Click to switch to VS Code]',
          'arrow-swap',
          'vs2026.toggleMode',
          'Click to return to standard VS Code layout (Sidebar on Left, default theme)'
        )
      );
    } else {
      items.push(
        new QuickSwitchItem(
          '⚪ VS 2026 Mode: OFF',
          '[Click to switch to VS 2026]',
          'arrow-swap',
          'vs2026.toggleMode',
          'Click to activate Visual Studio 2026 layout (Sidebar on Right, VS 2026 theme)'
        )
      );
    }

    // Green Start Button
    items.push(
      new QuickSwitchItem(
        '▶ Start Project (F5)',
        'Run / Debug',
        'play',
        'vs2026.startDebugging',
        'Start Debugging or Run the Project'
      )
    );

    // Quick Action: Start Window
    items.push(
      new QuickSwitchItem(
        '🏠 Create New Project / Start',
        'Console App, Clean App, Web API...',
        'home',
        'vs2026.openStartWindow',
        'Open Visual Studio 2026 Start Window'
      )
    );

    // Quick Action: Hot Reload
    items.push(
      new QuickSwitchItem(
        '🔥 Hot Reload (Live Code)',
        'Live Watcher Session',
        'flame',
        'vs2026.toggleHotReload',
        'Toggle Visual Studio 2026 Hot Reload'
      )
    );

    // Quick Action: Build
    items.push(
      new QuickSwitchItem(
        '⚙ Build Solution / Project',
        'Ctrl+Shift+B',
        'gear',
        'vs2026.buildSolution',
        'Build the current solution or project'
      )
    );

    return Promise.resolve(items);
  }
}
