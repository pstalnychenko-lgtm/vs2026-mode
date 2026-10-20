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
exports.NuGetWebviewPanel = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const nugetClient_1 = require("./nugetClient");
const csprojParser_1 = require("../solution/csprojParser");
class NuGetWebviewPanel {
    static currentPanel;
    _panel;
    _disposables = [];
    _projectPath;
    _onPackageChanged;
    static createOrShow(extensionUri, projectPath, onPackageChanged) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (NuGetWebviewPanel.currentPanel) {
            if (projectPath) {
                NuGetWebviewPanel.currentPanel._projectPath = projectPath;
                NuGetWebviewPanel.currentPanel.loadInstalledPackages();
            }
            NuGetWebviewPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('vs2026NuGet', 'NuGet: Solution Package Manager', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        NuGetWebviewPanel.currentPanel = new NuGetWebviewPanel(panel, projectPath, onPackageChanged || (() => { }));
    }
    constructor(panel, projectPath, onPackageChanged = () => { }) {
        this._panel = panel;
        this._projectPath = projectPath;
        this._onPackageChanged = onPackageChanged;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'search':
                    await this.handleSearch(message.query);
                    break;
                case 'install':
                    await this.handleInstall(message.packageId, message.version);
                    break;
                case 'uninstall':
                    await this.handleUninstall(message.packageId);
                    break;
                case 'refreshInstalled':
                    await this.loadInstalledPackages();
                    break;
            }
        }, null, this._disposables);
        this.renderHtml();
        this.initDefault();
    }
    async initDefault() {
        if (!this._projectPath) {
            const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 1);
            if (csprojFiles.length > 0) {
                this._projectPath = csprojFiles[0].fsPath;
            }
        }
        await this.loadInstalledPackages();
        await this.handleSearch('Microsoft.Extensions');
    }
    async handleSearch(query) {
        try {
            const results = await nugetClient_1.NuGetClient.search(query || 'Microsoft', 25);
            this._panel.webview.postMessage({ command: 'searchResults', results });
        }
        catch (err) {
            this._panel.webview.postMessage({ command: 'error', message: err.message || 'Search failed' });
        }
    }
    async loadInstalledPackages() {
        if (!this._projectPath) {
            return;
        }
        try {
            const model = await csprojParser_1.CsprojParser.parse(this._projectPath);
            this._panel.webview.postMessage({
                command: 'installedPackages',
                packages: model.packages,
                projectName: model.name
            });
        }
        catch (err) {
            console.error('Error loading installed packages:', err);
        }
    }
    async handleInstall(packageId, version) {
        if (!this._projectPath) {
            vscode.window.showErrorMessage('No project selected to install the NuGet package into.');
            return;
        }
        const versionArg = version ? `-v ${version}` : '';
        const cmd = `dotnet add "${this._projectPath}" package ${packageId} ${versionArg}`;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Visual Studio 2026: Installing NuGet package ${packageId}...`,
            cancellable: false
        }, () => new Promise((resolve, reject) => {
            (0, child_process_1.exec)(cmd, async (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Failed to install ${packageId}: ${stderr || error.message}`);
                    reject(error);
                }
                else {
                    vscode.window.showInformationMessage(`Successfully installed ${packageId} to project.`);
                    await this.loadInstalledPackages();
                    this._onPackageChanged();
                    resolve();
                }
            });
        }));
    }
    async handleUninstall(packageId) {
        if (!this._projectPath) {
            return;
        }
        const cmd = `dotnet remove "${this._projectPath}" package ${packageId}`;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Visual Studio 2026: Removing NuGet package ${packageId}...`,
            cancellable: false
        }, () => new Promise((resolve, reject) => {
            (0, child_process_1.exec)(cmd, async (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Failed to uninstall ${packageId}: ${stderr || error.message}`);
                    reject(error);
                }
                else {
                    vscode.window.showInformationMessage(`Successfully uninstalled ${packageId}.`);
                    await this.loadInstalledPackages();
                    this._onPackageChanged();
                    resolve();
                }
            });
        }));
    }
    renderHtml() {
        this._panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NuGet Package Manager</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    .header {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 12px;
    }
    .tabs {
      display: flex;
      gap: 8px;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 8px 16px;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 14px;
      border-bottom: 2px solid transparent;
    }
    .tab-btn.active {
      border-bottom: 2px solid #68217A;
      font-weight: bold;
    }
    .search-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    input[type="text"] {
      flex: 1;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      outline: none;
    }
    button.action-btn {
      background: #68217A;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 2px;
      cursor: pointer;
      font-weight: 500;
    }
    button.action-btn:hover {
      background: #8540A6;
    }
    button.danger-btn {
      background: #A80000;
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 2px;
      cursor: pointer;
    }
    .pkg-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pkg-card {
      border: 1px solid var(--vscode-panel-border);
      padding: 12px;
      border-radius: 4px;
      background: var(--vscode-sideBar-background);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pkg-info {
      max-width: 80%;
    }
    .pkg-title {
      font-size: 15px;
      font-weight: bold;
      color: #569CD6;
    }
    .pkg-version {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-left: 8px;
    }
    .pkg-desc {
      font-size: 13px;
      margin-top: 4px;
      color: var(--vscode-foreground);
    }
    .pkg-meta {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="tabs">
      <button class="tab-btn active" id="tabBrowse" onclick="switchTab('browse')">Browse</button>
      <button class="tab-btn" id="tabInstalled" onclick="switchTab('installed')">Installed</button>
    </div>
    <div style="margin-left:auto; font-size:12px; color:var(--vscode-descriptionForeground);" id="activeProjectLabel">
      Target Project: Loading...
    </div>
  </div>

  <div id="browseSection">
    <div class="search-bar">
      <input type="text" id="searchInput" placeholder="Search NuGet packages (e.g. Newtonsoft.Json, Serilog)..." onkeydown="if(event.key==='Enter') search()" />
      <button class="action-btn" onclick="search()">Search</button>
    </div>
    <div class="pkg-list" id="browseList">
      <div>Searching packages...</div>
    </div>
  </div>

  <div id="installedSection" style="display:none;">
    <div class="pkg-list" id="installedList">
      <div>Loading installed packages...</div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function switchTab(tab) {
      if (tab === 'browse') {
        document.getElementById('tabBrowse').classList.add('active');
        document.getElementById('tabInstalled').classList.remove('active');
        document.getElementById('browseSection').style.display = 'block';
        document.getElementById('installedSection').style.display = 'none';
      } else {
        document.getElementById('tabBrowse').classList.remove('active');
        document.getElementById('tabInstalled').classList.add('active');
        document.getElementById('browseSection').style.display = 'none';
        document.getElementById('installedSection').style.display = 'block';
        vscode.postMessage({ command: 'refreshInstalled' });
      }
    }

    function search() {
      const q = document.getElementById('searchInput').value;
      document.getElementById('browseList').innerHTML = '<div>Searching nuget.org...</div>';
      vscode.postMessage({ command: 'search', query: q });
    }

    function installPkg(id, ver) {
      vscode.postMessage({ command: 'install', packageId: id, version: ver });
    }

    function uninstallPkg(id) {
      vscode.postMessage({ command: 'uninstall', packageId: id });
    }

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'searchResults') {
        const list = document.getElementById('browseList');
        if (!msg.results || msg.results.length === 0) {
          list.innerHTML = '<div>No packages found.</div>';
          return;
        }
        list.innerHTML = msg.results.map(p => \`
          <div class="pkg-card">
            <div class="pkg-info">
              <span class="pkg-title">\${p.id}</span>
              <span class="pkg-version">v\${p.version}</span>
              <div class="pkg-desc">\${p.description || 'No description provided.'}</div>
              <div class="pkg-meta">Authors: \${p.authors.join(', ')} | Downloads: \${p.totalDownloads.toLocaleString()}</div>
            </div>
            <div>
              <button class="action-btn" onclick="installPkg('\${p.id}', '\${p.version}')">Install</button>
            </div>
          </div>
        \`).join('');
      } else if (msg.command === 'installedPackages') {
        document.getElementById('activeProjectLabel').innerText = 'Target Project: ' + (msg.projectName || 'Selected');
        const list = document.getElementById('installedList');
        if (!msg.packages || msg.packages.length === 0) {
          list.innerHTML = '<div>No packages installed in this project.</div>';
          return;
        }
        list.innerHTML = msg.packages.map(p => \`
          <div class="pkg-card">
            <div class="pkg-info">
              <span class="pkg-title">\${p.name}</span>
              <span class="pkg-version">\${p.version}</span>
            </div>
            <div>
              <button class="danger-btn" onclick="uninstallPkg('\${p.name}')">Uninstall</button>
            </div>
          </div>
        \`).join('');
      }
    });
  </script>
</body>
</html>`;
    }
    dispose() {
        NuGetWebviewPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }
}
exports.NuGetWebviewPanel = NuGetWebviewPanel;
//# sourceMappingURL=nugetWebview.js.map