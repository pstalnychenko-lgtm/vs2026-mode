import * as vscode from 'vscode';

export class DevTerminalProfile {
  private static terminalInstance?: vscode.Terminal;

  public static open(): vscode.Terminal {
    if (this.terminalInstance && this.terminalInstance.exitStatus === undefined) {
      this.terminalInstance.show();
      return this.terminalInstance;
    }

    const isWin = process.platform === 'win32';
    const env: { [key: string]: string } = {
      DOTNET_CLI_TELEMETRY_OPTOUT: '1',
      VS_MODE: '2026'
    };
    if (!isWin) {
      env.PATH = `/opt/homebrew/bin:/opt/homebrew/opt/openjdk/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}`;
    }

    this.terminalInstance = vscode.window.createTerminal({
      name: 'Developer Terminal (VS 2026)',
      message: 'Visual Studio 2026 Developer Terminal Initialized.\nType "dotnet --info" or "dotnet build" to work with projects.\n',
      env
    });

    this.terminalInstance.show();
    return this.terminalInstance;
  }
}
