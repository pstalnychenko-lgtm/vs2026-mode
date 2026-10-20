import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { LayoutManager } from './layout/layoutManager';
import { SolutionExplorerProvider } from './solution/solutionExplorer';
import { AddItemWizard } from './wizards/addItemWizard';
import { ToolbarView } from './toolbar/toolbarView';
import { ErrorListProvider } from './errorList/errorListProvider';
import { PropertiesViewProvider } from './properties/propertiesView';
import { TestExplorerProvider } from './testExplorer/testExplorerProvider';
import { HotReloadService } from './hotReload/hotReloadService';
import { StartWindowWebview } from './startWindow/startWindowWebview';
import { PublishWizard } from './publish/publishWizard';
import { NuGetWebviewPanel } from './nuget/nugetWebview';
import { DevTerminalProfile } from './terminal/devTerminalProfile';
import { SolutionTreeItem } from './solution/solutionTreeItem';

import { QuickSwitchProvider } from './layout/quickSwitchProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Activating Visual Studio 2026 Mode Extension (v2)...');

  // 1. Layout Manager
  const layoutManager = new LayoutManager(context);
  await layoutManager.initialize();

  // Quick Switch Provider in Explorer
  const quickSwitchProvider = new QuickSwitchProvider(layoutManager);
  vscode.window.registerTreeDataProvider('vs2026.quickSwitch', quickSwitchProvider);

  // 2. Solution Explorer Provider
  const solutionProvider = new SolutionExplorerProvider();
  vscode.window.registerTreeDataProvider('vs2026.solutionExplorer', solutionProvider);

  // 3. Properties View Provider
  const propertiesProvider = new PropertiesViewProvider();
  vscode.window.registerTreeDataProvider('vs2026.propertiesView', propertiesProvider);

  // 4. Error List Provider
  const errorListProvider = new ErrorListProvider();
  vscode.window.registerTreeDataProvider('vs2026.errorList', errorListProvider);

  // 5. Test Explorer Provider
  const testExplorerProvider = new TestExplorerProvider();
  vscode.window.registerTreeDataProvider('vs2026.testExplorer', testExplorerProvider);

  // 6. Standard Toolbar View
  const toolbarView = new ToolbarView(context);

  // 7. Hot Reload Service
  const hotReloadService = HotReloadService.getInstance(context);

  // 8. File System Watchers
  const projWatcher = vscode.workspace.createFileSystemWatcher('**/*.{sln,slnx,csproj,py,java,cpp}');
  projWatcher.onDidCreate(() => {
    solutionProvider.refresh();
    testExplorerProvider.refresh();
  });
  projWatcher.onDidChange(() => {
    solutionProvider.refresh();
  });
  projWatcher.onDidDelete(() => {
    solutionProvider.refresh();
    testExplorerProvider.refresh();
  });
  context.subscriptions.push(projWatcher);

  // Output channel for build/diagnostic logs
  const outputChannel = vscode.window.createOutputChannel('Visual Studio 2026 Build');
  context.subscriptions.push(outputChannel);

  // 9. Register Commands
  context.subscriptions.push(
    // Mode Switcher
    vscode.commands.registerCommand('vs2026.toggleMode', async () => {
      await layoutManager.toggleMode();
      quickSwitchProvider.refresh();
    }),

    vscode.commands.registerCommand('vs2026.enableMode', async () => {
      await layoutManager.enableVS2026Mode(true);
      quickSwitchProvider.refresh();
    }),

    vscode.commands.registerCommand('vs2026.disableMode', async () => {
      await layoutManager.disableVS2026Mode(true);
      quickSwitchProvider.refresh();
    }),

    // Start Window
    vscode.commands.registerCommand('vs2026.openStartWindow', () => {
      StartWindowWebview.show(context);
    }),

    // Hot Reload
    vscode.commands.registerCommand('vs2026.toggleHotReload', async () => {
      const startupProj = toolbarView.getStartupProject();
      await hotReloadService.toggle(startupProj);
    }),

    // Publish Wizard
    vscode.commands.registerCommand('vs2026.publishProject', async (item?: SolutionTreeItem) => {
      await PublishWizard.show(item?.filePath);
    }),

    // Testing
    vscode.commands.registerCommand('vs2026.runAllTests', async () => {
      await testExplorerProvider.runAllTests();
    }),

    vscode.commands.registerCommand('vs2026.refreshTests', () => {
      testExplorerProvider.refresh();
      vscode.window.showInformationMessage('Test Explorer refreshed.');
    }),

    // Solution Explorer Refresh
    vscode.commands.registerCommand('vs2026.refreshSolution', () => {
      solutionProvider.refresh();
      vscode.window.showInformationMessage('Solution Explorer refreshed.');
    }),

    // Add New Item Wizards (Multi-language)
    vscode.commands.registerCommand('vs2026.addNewItem', async (target?: any) => {
      await AddItemWizard.show(target);
      solutionProvider.refresh();
    }),

    vscode.commands.registerCommand('vs2026.addClass', async (target?: any) => {
      await AddItemWizard.show(target, 'cs-class');
      solutionProvider.refresh();
    }),

    vscode.commands.registerCommand('vs2026.addInterface', async (target?: any) => {
      await AddItemWizard.show(target, 'cs-interface');
      solutionProvider.refresh();
    }),

    vscode.commands.registerCommand('vs2026.addEnum', async (target?: any) => {
      await AddItemWizard.show(target, 'cs-enum');
      solutionProvider.refresh();
    }),

    // Build Actions
    vscode.commands.registerCommand('vs2026.buildSolution', async (item?: SolutionTreeItem) => {
      const activeEditor = vscode.window.activeTextEditor;
      const targetPath = item?.filePath || activeEditor?.document.fileName || vscode.workspace.rootPath || '';
      const config = toolbarView.getConfiguration();

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`------ Build started: ${targetPath} [${config}] ------`);

      // Determine build command by file type
      let cmd = `dotnet build "${targetPath}" -c ${config}`;
      if (targetPath.endsWith('pom.xml') || targetPath.endsWith('.java')) {
        cmd = 'mvn compile';
      } else if (targetPath.endsWith('CMakeLists.txt') || targetPath.endsWith('.cpp')) {
        cmd = 'cmake --build build';
      } else if (targetPath.endsWith('package.json') || targetPath.endsWith('.ts')) {
        cmd = 'npm run build';
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Visual Studio 2026: Building...`,
          cancellable: false
        },
        () =>
          new Promise<void>((resolve, reject) => {
            exec(cmd, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
              outputChannel.append(stdout);
              if (stderr) outputChannel.append(stderr);
              if (error) {
                outputChannel.appendLine(`\n========== Build FAILED ==========\n`);
                vscode.window.showErrorMessage('Build Failed. Check Output and Error List.');
                reject(error);
              } else {
                outputChannel.appendLine(`\n========== Build: 1 succeeded, 0 failed ==========\n`);
                vscode.window.showInformationMessage('Build succeeded.');
                resolve();
              }
            });
          })
      );
    }),

    vscode.commands.registerCommand('vs2026.rebuildSolution', async (item?: SolutionTreeItem) => {
      const targetPath = item?.filePath || vscode.workspace.rootPath || '';
      const config = toolbarView.getConfiguration();
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`------ Rebuild started: Configuration: ${config} ------`);

      const cmd = `dotnet clean "${targetPath}" && dotnet build "${targetPath}" -c ${config} --no-incremental`;
      exec(cmd, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
        outputChannel.append(stdout);
        if (error) {
          vscode.window.showErrorMessage('Rebuild failed.');
        } else {
          vscode.window.showInformationMessage('Rebuild succeeded.');
        }
      });
    }),

    vscode.commands.registerCommand('vs2026.cleanSolution', async (item?: SolutionTreeItem) => {
      const targetPath = item?.filePath || vscode.workspace.rootPath || '';
      exec(`dotnet clean "${targetPath}"`, { cwd: vscode.workspace.rootPath }, (error, stdout) => {
        outputChannel.append(stdout);
        vscode.window.showInformationMessage('Clean solution completed.');
      });
    }),

    // Start Debugging (F5) - Universal Multi-Language Launcher (Visual Studio 2026 style)
    vscode.commands.registerCommand('vs2026.startDebugging', async () => {
      // 1. Auto-save all files before building/running (Authentic Visual Studio behaviour)
      await vscode.workspace.saveAll(false);

      // 2. Identify the active file or first visible editor
      let editor = vscode.window.activeTextEditor;
      if (!editor && vscode.window.visibleTextEditors.length > 0) {
        editor = vscode.window.visibleTextEditors[0];
      }

      const term = DevTerminalProfile.open();

      if (editor && editor.document && editor.document.fileName) {
        const filePath = editor.document.fileName;
        const fileDir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath, ext);

        const isWin = process.platform === 'win32';
        const cdCmd = isWin ? `cd /d "${fileDir}"` : `cd "${fileDir}"`;

        // Swift (.swift)
        if (ext === '.swift') {
          const hasPackage = fs.existsSync(path.join(fileDir, 'Package.swift')) || fs.existsSync(path.join(fileDir, '..', 'Package.swift'));
          term.sendText(`${cdCmd} && ${hasPackage ? 'swift run' : `swift "${fileName}"`}`);
          return;
        }

        // Python (.py)
        if (ext === '.py') {
          let pyCmd = isWin ? 'python' : 'python3';
          if (fs.existsSync(path.join(fileDir, '.venv'))) {
            pyCmd = isWin ? '.\\.venv\\Scripts\\python.exe' : './.venv/bin/python';
          } else if (fs.existsSync(path.join(fileDir, 'venv'))) {
            pyCmd = isWin ? '.\\venv\\Scripts\\python.exe' : './venv/bin/python';
          }
          term.sendText(`${cdCmd} && ${pyCmd} "${fileName}"`);
          return;
        }

        // Go (.go)
        if (ext === '.go') {
          const hasMod = fs.existsSync(path.join(fileDir, 'go.mod')) || fs.existsSync(path.join(fileDir, '..', 'go.mod'));
          term.sendText(`${cdCmd} && ${hasMod ? 'go run .' : `go run "${fileName}"`}`);
          return;
        }

        // Java (.java)
        if (ext === '.java') {
          term.sendText(`${cdCmd} && java "${fileName}"`);
          return;
        }

        // C / C++ (.cpp, .cc, .cxx, .c)
        if (['.cpp', '.cc', '.cxx', '.c'].includes(ext)) {
          const compiler = isWin ? (ext === '.c' ? 'gcc' : 'g++') : (ext === '.c' ? 'clang' : 'clang++');
          const stdFlag = ext === '.c' ? '-std=c17' : '-std=c++20';
          const outName = isWin ? `${baseName}.exe` : baseName;
          const execPrefix = isWin ? '.\\' : './';
          term.sendText(`${cdCmd} && ${compiler} ${stdFlag} "${fileName}" -o "${outName}" && ${execPrefix}"${outName}"`);
          return;
        }

        // Rust (.rs)
        if (ext === '.rs') {
          const hasCargo = fs.existsSync(path.join(fileDir, 'Cargo.toml')) || fs.existsSync(path.join(fileDir, '..', 'Cargo.toml'));
          if (hasCargo) {
            term.sendText(`${cdCmd} && cargo run`);
          } else {
            const outName = isWin ? `${baseName}.exe` : baseName;
            const execPrefix = isWin ? '.\\' : './';
            term.sendText(`${cdCmd} && rustc "${fileName}" -o "${outName}" && ${execPrefix}"${outName}"`);
          }
          return;
        }

        // TypeScript / JavaScript (.ts, .js, .mjs)
        if (ext === '.ts') {
          term.sendText(`${cdCmd} && npx ts-node "${fileName}"`);
          return;
        }
        if (ext === '.js' || ext === '.mjs') {
          term.sendText(`${cdCmd} && node "${fileName}"`);
          return;
        }

        // C# Script (.csx)
        if (ext === '.csx') {
          term.sendText(`cd "${fileDir}" && dotnet script "${fileName}"`);
          return;
        }

        // C# file (.cs) - find parent .csproj
        if (ext === '.cs') {
          let currentDir = fileDir;
          let foundCsproj: string | undefined;
          for (let i = 0; i < 6; i++) {
            try {
              const files = fs.readdirSync(currentDir);
              const csproj = files.find(f => f.endsWith('.csproj'));
              if (csproj) {
                foundCsproj = path.join(currentDir, csproj);
                break;
              }
            } catch {}
            const parent = path.dirname(currentDir);
            if (parent === currentDir) break;
            currentDir = parent;
          }

          if (foundCsproj) {
            term.sendText(`dotnet run --project "${foundCsproj}" -c ${toolbarView.getConfiguration()}`);
            return;
          }
        }
      }

      // Fallback: Check workspace project types
      let startupProj = toolbarView.getStartupProject();
      if (!startupProj) {
        const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 1);
        if (csprojFiles.length > 0) {
          startupProj = csprojFiles[0].fsPath;
          toolbarView.setStartupProject(startupProj);
        }
      }

      if (startupProj) {
        term.sendText(`dotnet run --project "${startupProj}" -c ${toolbarView.getConfiguration()}`);
        return;
      }

      // Swift workspace
      const swiftFiles = await vscode.workspace.findFiles('{Package.swift,main.swift}', '**/node_modules/**', 1);
      if (swiftFiles.length > 0) {
        const swiftPath = swiftFiles[0].fsPath;
        term.sendText(`cd "${path.dirname(swiftPath)}" && if [ -f "Package.swift" ]; then swift run; else swift "${path.basename(swiftPath)}"; fi`);
        return;
      }

      // Python workspace
      const pyFiles = await vscode.workspace.findFiles('{main.py,app.py,run.py}', '**/node_modules/**', 1);
      if (pyFiles.length > 0) {
        const pyPath = pyFiles[0].fsPath;
        term.sendText(`cd "${path.dirname(pyPath)}" && python3 "${path.basename(pyPath)}"`);
        return;
      }

      // Go workspace
      const goFiles = await vscode.workspace.findFiles('{main.go,go.mod}', '**/vendor/**', 1);
      if (goFiles.length > 0) {
        term.sendText(`cd "${path.dirname(goFiles[0].fsPath)}" && go run .`);
        return;
      }

      // Web / Node workspace
      const pkgFiles = await vscode.workspace.findFiles('package.json', '**/node_modules/**', 1);
      if (pkgFiles.length > 0) {
        term.sendText(`cd "${path.dirname(pkgFiles[0].fsPath)}" && npm start`);
        return;
      }

      // Default fallback
      term.sendText(`dotnet run -c ${toolbarView.getConfiguration()}`);
    }),

    vscode.commands.registerCommand('vs2026.startWithoutDebugging', async () => {
      await vscode.commands.executeCommand('vs2026.startDebugging');
    }),

    // Manage NuGet Packages
    vscode.commands.registerCommand('vs2026.manageNuGet', (item?: SolutionTreeItem) => {
      const projectPath = item?.filePath || toolbarView.getStartupProject();
      NuGetWebviewPanel.createOrShow(context.extensionUri, projectPath, () => {
        solutionProvider.refresh();
      });
    }),

    // Developer Terminal
    vscode.commands.registerCommand('vs2026.openDevTerminal', () => {
      DevTerminalProfile.open();
    }),

    // Set Startup Project
    vscode.commands.registerCommand('vs2026.setStartupProject', (item?: SolutionTreeItem) => {
      if (item && item.filePath) {
        toolbarView.setStartupProject(item.filePath);
        vscode.window.showInformationMessage(`Startup target set to: ${item.label}`);
      } else {
        toolbarView.selectStartupProject();
      }
    }),

    // Toolbar config commands
    vscode.commands.registerCommand('vs2026.toggleConfiguration', () => {
      toolbarView.toggleConfiguration();
    }),

    vscode.commands.registerCommand('vs2026.selectStartupProject', () => {
      toolbarView.selectStartupProject();
    })
  );

  console.log('Visual Studio 2026 Mode extension (v2) activated successfully.');
}

export function deactivate() {
  console.log('Visual Studio 2026 Mode extension deactivated.');
}
