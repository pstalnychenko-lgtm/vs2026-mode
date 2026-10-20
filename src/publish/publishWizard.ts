import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

export class PublishWizard {
  public static async show(projectPath?: string): Promise<void> {
    let targetProj = projectPath;
    if (!targetProj) {
      const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 10);
      if (csprojFiles.length === 0) {
        vscode.window.showWarningMessage('No publishable C# projects found in workspace.');
        return;
      }
      const picks = csprojFiles.map(c => ({
        label: path.basename(c.fsPath, '.csproj'),
        description: c.fsPath,
        uri: c
      }));
      const selected = await vscode.window.showQuickPick(picks, {
        placeHolder: 'Select Project to Publish (Visual Studio 2026)'
      });
      if (!selected) return;
      targetProj = selected.uri.fsPath;
    }

    const panel = vscode.window.createWebviewPanel(
      'vs2026Publish',
      `Publish: ${path.basename(targetProj, '.csproj')}`,
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const projDir = path.dirname(targetProj);
    const defaultOut = path.join(projDir, 'bin', 'Publish');

    panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px 32px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    h2 { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
    .form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    label { font-weight: 600; font-size: 13px; }
    select, input[type="text"] {
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
    }
    .checkbox-group { display: flex; align-items: center; gap: 8px; }
    button.btn {
      background: #68217A;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 2px;
      margin-top: 12px;
    }
    button.btn:hover { background: #8540A6; }
    #outputBox {
      margin-top: 20px;
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
      display: none;
    }
  </style>
</head>
<body>
  <h2>🚀 Visual Studio 2026 Publish Wizard</h2>
  <div class="form-group">
    <label>Project:</label>
    <input type="text" value="${targetProj}" readonly />
  </div>
  <div class="form-group">
    <label>Configuration:</label>
    <select id="config">
      <option value="Release">Release (Optimized)</option>
      <option value="Debug">Debug</option>
    </select>
  </div>
  <div class="form-group">
    <label>Target Runtime:</label>
    <select id="runtime">
      <option value="portable">Portable (.NET Core Default)</option>
      <option value="osx-arm64">macOS Apple Silicon (osx-arm64)</option>
      <option value="linux-x64">Linux 64-bit (linux-x64)</option>
      <option value="win-x64">Windows 64-bit (win-x64)</option>
    </select>
  </div>
  <div class="form-group">
    <label>Deployment Mode:</label>
    <select id="mode">
      <option value="Framework-Dependent">Framework-Dependent</option>
      <option value="Self-Contained">Self-Contained (bundles .NET runtime)</option>
    </select>
  </div>
  <div class="form-group checkbox-group">
    <input type="checkbox" id="singleFile" checked />
    <label for="singleFile">Produce single file executable (-p:PublishSingleFile=true)</label>
  </div>
  <div class="form-group">
    <label>Target Output Directory:</label>
    <input type="text" id="outputDir" value="${defaultOut}" />
  </div>
  <button class="btn" onclick="publish()">Publish Project</button>

  <div id="outputBox"></div>

  <script>
    const vscode = acquireVsCodeApi();
    function publish() {
      const config = document.getElementById('config').value;
      const runtime = document.getElementById('runtime').value;
      const mode = document.getElementById('mode').value;
      const singleFile = document.getElementById('singleFile').checked;
      const outputDir = document.getElementById('outputDir').value;

      document.getElementById('outputBox').style.display = 'block';
      document.getElementById('outputBox').innerText = 'Starting publication process...';

      vscode.postMessage({
        command: 'runPublish',
        config,
        runtime,
        mode,
        singleFile,
        outputDir
      });
    }

    window.addEventListener('message', ev => {
      const msg = ev.data;
      if (msg.command === 'log') {
        const box = document.getElementById('outputBox');
        box.innerText += '\\n' + msg.text;
        box.scrollTop = box.scrollHeight;
      }
    });
  </script>
</body>
</html>`;

    panel.webview.onDidReceiveMessage(async msg => {
      if (msg.command === 'runPublish') {
        let args = `dotnet publish "${targetProj}" -c ${msg.config} -o "${msg.outputDir}"`;
        if (msg.runtime !== 'portable') {
          args += ` -r ${msg.runtime}`;
        }
        if (msg.mode === 'Self-Contained') {
          args += ` --self-contained true`;
        } else {
          args += ` --self-contained false`;
        }
        if (msg.singleFile) {
          args += ` -p:PublishSingleFile=true`;
        }

        panel.webview.postMessage({ command: 'log', text: `Executing: ${args}` });

        exec(args, (err, stdout, stderr) => {
          if (stdout) panel.webview.postMessage({ command: 'log', text: stdout });
          if (stderr) panel.webview.postMessage({ command: 'log', text: stderr });

          if (err) {
            panel.webview.postMessage({ command: 'log', text: `\n❌ Publish Failed: ${err.message}` });
            vscode.window.showErrorMessage('Publish failed.');
          } else {
            panel.webview.postMessage({ command: 'log', text: `\n✅ Publish succeeded! Output in ${msg.outputDir}` });
            vscode.window.showInformationMessage('Publish succeeded!');
          }
        });
      }
    });
  }
}
