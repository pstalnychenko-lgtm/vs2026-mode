import * as vscode from 'vscode';

export class LayoutManager {
  private static readonly PREV_SIDEBAR_KEY = 'vs2026.prevSidebarLocation';
  private static readonly PREV_THEME_KEY = 'vs2026.prevTheme';
  private static readonly IS_ACTIVE_KEY = 'vs2026.isModeActive';

  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      110
    );
    this.statusBarItem.command = 'vs2026.toggleMode';
    this.context.subscriptions.push(this.statusBarItem);
  }

  public async initialize(): Promise<void> {
    const isCSharpWorkspace = await this.detectCSharpWorkspace();
    const config = vscode.workspace.getConfiguration('vs2026');
    const autoSwitch = config.get<boolean>('autoSwitchOnCSharp', true);

    const wasActive = this.context.globalState.get<boolean>(LayoutManager.IS_ACTIVE_KEY, false);

    if ((isCSharpWorkspace && autoSwitch) || wasActive) {
      await this.enableVS2026Mode(false);
    } else {
      this.updateStatusBar(false);
    }
  }

  public async detectCSharpWorkspace(): Promise<boolean> {
    const slnFiles = await vscode.workspace.findFiles('**/*.{sln,slnx}', '**/node_modules/**', 1);
    if (slnFiles.length > 0) {
      return true;
    }
    const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 1);
    if (csprojFiles.length > 0) {
      return true;
    }
    // Also detect Python, Java, or C++ projects
    const pyFiles = await vscode.workspace.findFiles('**/{requirements.txt,pyproject.toml}', '**/node_modules/**', 1);
    if (pyFiles.length > 0) {
      return true;
    }
    const javaFiles = await vscode.workspace.findFiles('**/{pom.xml,build.gradle}', '**/node_modules/**', 1);
    return javaFiles.length > 0;
  }

  public isModeActive(): boolean {
    return this.context.globalState.get<boolean>(LayoutManager.IS_ACTIVE_KEY, false);
  }

  public async toggleMode(): Promise<void> {
    if (this.isModeActive()) {
      await this.disableVS2026Mode(true);
    } else {
      await this.enableVS2026Mode(true);
    }
  }

  public async enableVS2026Mode(notify: boolean = true): Promise<void> {
    const workbenchConfig = vscode.workspace.getConfiguration('workbench');
    
    // Save current settings for restoration
    const currentSidebar = workbenchConfig.get<string>('sideBar.location', 'left');
    const currentTheme = workbenchConfig.get<string>('colorTheme', 'Default Dark Modern');

    if (!this.isModeActive()) {
      await this.context.globalState.update(LayoutManager.PREV_SIDEBAR_KEY, currentSidebar);
      await this.context.globalState.update(LayoutManager.PREV_THEME_KEY, currentTheme);
    }

    // Apply Visual Studio 2026 layout
    try {
      await workbenchConfig.update('sideBar.location', 'right', vscode.ConfigurationTarget.Global);
      await workbenchConfig.update('colorTheme', 'Visual Studio 2026 Dark', vscode.ConfigurationTarget.Global);
    } catch (err) {
      console.warn('Could not update workbench settings directly:', err);
    }

    await this.context.globalState.update(LayoutManager.IS_ACTIVE_KEY, true);
    await vscode.commands.executeCommand('setContext', 'vs2026:active', true);
    this.updateStatusBar(true);

    if (notify) {
      vscode.window.showInformationMessage(
        'Visual Studio 2026 Mode Activated: Solution Explorer on the right, VS 2026 Theme & Shortcuts enabled.'
      );
    }
  }

  public async disableVS2026Mode(notify: boolean = true): Promise<void> {
    const workbenchConfig = vscode.workspace.getConfiguration('workbench');
    const prevSidebar = this.context.globalState.get<string>(LayoutManager.PREV_SIDEBAR_KEY, 'left');
    const prevTheme = this.context.globalState.get<string>(LayoutManager.PREV_THEME_KEY, 'Default Dark Modern');

    try {
      await workbenchConfig.update('sideBar.location', prevSidebar, vscode.ConfigurationTarget.Global);
      await workbenchConfig.update('colorTheme', prevTheme, vscode.ConfigurationTarget.Global);
    } catch (err) {
      console.warn('Could not restore workbench settings:', err);
    }

    await this.context.globalState.update(LayoutManager.IS_ACTIVE_KEY, false);
    await vscode.commands.executeCommand('setContext', 'vs2026:active', false);
    this.updateStatusBar(false);

    if (notify) {
      vscode.window.showInformationMessage('Visual Studio 2026 Mode Deactivated. Standard VS Code layout restored.');
    }
  }

  private updateStatusBar(active: boolean): void {
    if (active) {
      this.statusBarItem.text = '$(layout-sidebar-right) 🟣 [VS 2026: ON]';
      this.statusBarItem.tooltip = 'Visual Studio 2026 Mode is Active. Click to switch back to standard VS Code layout.';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.text = '$(layout-sidebar-left) ⚪ [VS 2026: OFF]';
      this.statusBarItem.tooltip = 'Visual Studio 2026 Mode is Inactive. Click to switch to Visual Studio 2026 layout.';
      this.statusBarItem.backgroundColor = undefined;
    }
    this.statusBarItem.show();
  }
}
