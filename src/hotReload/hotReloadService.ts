import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';

export class HotReloadService {
  private static instance: HotReloadService;
  private watchProcess?: ChildProcess;
  private isWatching: boolean = false;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;

  public static getInstance(context: vscode.ExtensionContext): HotReloadService {
    if (!HotReloadService.instance) {
      HotReloadService.instance = new HotReloadService(context);
    }
    return HotReloadService.instance;
  }

  private constructor(context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('Visual Studio 2026 Hot Reload');
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.text = '$(flame) Hot Reload';
    this.statusBarItem.tooltip = 'Click to Toggle Visual Studio 2026 Hot Reload (Live Code Editing)';
    this.statusBarItem.command = 'vs2026.toggleHotReload';
    this.statusBarItem.show();
    context.subscriptions.push(this.outputChannel, this.statusBarItem);
  }

  public async toggle(projectPath?: string): Promise<void> {
    if (this.isWatching) {
      this.stop();
    } else {
      await this.start(projectPath);
    }
  }

  public async start(projectPath?: string): Promise<void> {
    if (this.isWatching) {
      vscode.window.showInformationMessage('Hot Reload is already active.');
      return;
    }

    let target = projectPath;
    if (!target) {
      const csproj = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 1);
      if (csproj.length > 0) {
        target = csproj[0].fsPath;
      }
    }

    this.outputChannel.clear();
    this.outputChannel.show(true);
    this.outputChannel.appendLine('========================================');
    this.outputChannel.appendLine('[Hot Reload 🔥] Starting Live Watcher Session...');
    this.outputChannel.appendLine(`[Hot Reload 🔥] Target: ${target || 'Current Workspace'}`);
    this.outputChannel.appendLine('========================================\n');

    const cwd = vscode.workspace.rootPath || process.cwd();
    const args = target ? ['watch', '--project', target] : ['watch'];

    try {
      this.watchProcess = spawn('dotnet', args, { cwd, shell: true });
      this.isWatching = true;
      this.statusBarItem.text = '$(flame) Hot Reload: Active';
      this.statusBarItem.color = '#FFA500'; // Orange fire accent

      this.watchProcess.stdout?.on('data', data => {
        const str = data.toString();
        this.outputChannel.append(str);
        if (str.includes('Hot reload') || str.includes('Building') || str.includes('File changed')) {
          vscode.window.setStatusBarMessage('$(check) Hot Reload applied changes successfully.', 3000);
        }
      });

      this.watchProcess.stderr?.on('data', data => {
        this.outputChannel.append(`[ERR] ${data.toString()}`);
      });

      this.watchProcess.on('close', code => {
        this.isWatching = false;
        this.statusBarItem.text = '$(flame) Hot Reload';
        this.statusBarItem.color = undefined;
        this.outputChannel.appendLine(`\n[Hot Reload 🔥] Session terminated with code ${code}.`);
      });

      vscode.window.showInformationMessage('Visual Studio 2026: Hot Reload (🔥) session started!');
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to start Hot Reload: ${err.message}`);
    }
  }

  public stop(): void {
    if (this.watchProcess) {
      this.watchProcess.kill();
      this.watchProcess = undefined;
    }
    this.isWatching = false;
    this.statusBarItem.text = '$(flame) Hot Reload';
    this.statusBarItem.color = undefined;
    this.outputChannel.appendLine('\n[Hot Reload 🔥] Stopped by user.');
    vscode.window.showInformationMessage('Visual Studio 2026: Hot Reload stopped.');
  }
}
