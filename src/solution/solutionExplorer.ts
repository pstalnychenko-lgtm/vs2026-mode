import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SlnParser, SolutionModel } from './slnParser';
import { CsprojParser, CsprojModel } from './csprojParser';
import { SolutionTreeItem, ItemType } from './solutionTreeItem';

export class SolutionExplorerProvider implements vscode.TreeDataProvider<SolutionTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SolutionTreeItem | undefined | void> =
    new vscode.EventEmitter<SolutionTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<SolutionTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private currentSolution: SolutionModel | null = null;
  private standaloneProjects: CsprojModel[] = [];
  private parsedProjectsCache: Map<string, CsprojModel> = new Map();

  constructor() {
    this.refresh();
  }

  public refresh(): void {
    this.currentSolution = null;
    this.standaloneProjects = [];
    this.parsedProjectsCache.clear();
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: SolutionTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return [
        new SolutionTreeItem('No folder or solution open', 'file', vscode.TreeItemCollapsibleState.None)
      ];
    }

    if (!element) {
      return await this.getRootElements();
    }

    switch (element.itemType) {
      case 'solution':
        return await this.getSolutionProjects(element);
      case 'project':
        return await this.getProjectChildren(element);
      case 'dependencies':
        return await this.getDependenciesChildren(element);
      case 'packages-folder':
        return await this.getPackagesChildren(element);
      case 'projects-folder':
        return await this.getProjectReferencesChildren(element);
      case 'folder':
        return await this.getFolderChildren(element);
      default:
        return [];
    }
  }

  private async getRootElements(): Promise<SolutionTreeItem[]> {
    const slnFiles = await vscode.workspace.findFiles('**/*.{sln,slnx}', '**/node_modules/**', 5);

    if (slnFiles.length > 0) {
      const slnUri = slnFiles[0];
      try {
        this.currentSolution = await SlnParser.parse(slnUri.fsPath);
        const count = this.currentSolution.projects.filter(p => !p.isSolutionFolder).length;
        return [
          new SolutionTreeItem(
            `Solution '${this.currentSolution.name}' (${count} project${count === 1 ? '' : 's'})`,
            'solution',
            vscode.TreeItemCollapsibleState.Expanded,
            { filePath: this.currentSolution.filePath }
          )
        ];
      } catch (err) {
        console.error('Error parsing solution file:', err);
      }
    }

    // Fallback: check for C# (.csproj), Python (pyproject.toml, requirements.txt), Java (pom.xml), or Node (package.json)
    const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 20);
    const items: SolutionTreeItem[] = [];

    for (const csprojUri of csprojFiles) {
      try {
        const model = await this.getCsprojModel(csprojUri.fsPath);
        items.push(
          new SolutionTreeItem(
            model.name,
            'project',
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              filePath: model.filePath,
              projectPath: model.directory,
              description: `[${model.targetFramework}]`
            }
          )
        );
      } catch (err) {
        console.error('Error parsing csproj file:', err);
      }
    }

    // Python Project detection
    const pyReqs = await vscode.workspace.findFiles('**/requirements.txt', '**/node_modules/**', 5);
    for (const pyUri of pyReqs) {
      const dir = path.dirname(pyUri.fsPath);
      const name = path.basename(dir);
      items.push(
        new SolutionTreeItem(
          `Python Project: ${name}`,
          'project',
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            filePath: pyUri.fsPath,
            projectPath: dir,
            description: '[Python]'
          }
        )
      );
    }

    // Java Project detection (pom.xml)
    const pomFiles = await vscode.workspace.findFiles('**/pom.xml', '**/node_modules/**', 5);
    for (const pomUri of pomFiles) {
      const dir = path.dirname(pomUri.fsPath);
      const name = path.basename(dir);
      items.push(
        new SolutionTreeItem(
          `Java Maven Project: ${name}`,
          'project',
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            filePath: pomUri.fsPath,
            projectPath: dir,
            description: '[Java Maven]'
          }
        )
      );
    }

    if (items.length === 0) {
      return [
        new SolutionTreeItem('No .sln or .csproj files found', 'file', vscode.TreeItemCollapsibleState.None)
      ];
    }

    return items;
  }

  private async getSolutionProjects(solutionItem: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!this.currentSolution) {
      return [];
    }

    const items: SolutionTreeItem[] = [];
    for (const proj of this.currentSolution.projects) {
      if (proj.isSolutionFolder) {
        continue;
      }
      try {
        const model = await this.getCsprojModel(proj.absolutePath);
        items.push(
          new SolutionTreeItem(
            model.name,
            'project',
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              filePath: model.filePath,
              projectPath: model.directory,
              description: `[${model.targetFramework}]`
            }
          )
        );
      } catch {
        items.push(
          new SolutionTreeItem(
            proj.name,
            'project',
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              filePath: proj.absolutePath,
              projectPath: path.dirname(proj.absolutePath)
            }
          )
        );
      }
    }

    return items;
  }

  private async getProjectChildren(projectItem: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!projectItem.filePath) {
      return [];
    }

    const projectDir = projectItem.projectPath || path.dirname(projectItem.filePath);
    const items: SolutionTreeItem[] = [];

    // Dependencies node
    items.push(
      new SolutionTreeItem(
        'Dependencies',
        'dependencies',
        vscode.TreeItemCollapsibleState.Collapsed,
        {
          filePath: projectItem.filePath,
          projectPath: projectDir
        }
      )
    );

    // List files and directories inside projectDir
    const dirItems = await this.getDirectoryItems(projectDir, projectItem.filePath);
    return items.concat(dirItems);
  }

  private async getDependenciesChildren(depItem: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!depItem.filePath) {
      return [];
    }

    const model = await this.getCsprojModel(depItem.filePath);
    const items: SolutionTreeItem[] = [];

    if (model.packages.length > 0) {
      items.push(
        new SolutionTreeItem(
          `Packages (${model.packages.length})`,
          'packages-folder',
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            filePath: depItem.filePath,
            projectPath: depItem.projectPath
          }
        )
      );
    }

    if (model.projectReferences.length > 0) {
      items.push(
        new SolutionTreeItem(
          `Projects (${model.projectReferences.length})`,
          'projects-folder',
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            filePath: depItem.filePath,
            projectPath: depItem.projectPath
          }
        )
      );
    }

    return items;
  }

  private async getPackagesChildren(pkgFolderItem: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!pkgFolderItem.filePath) {
      return [];
    }
    const model = await this.getCsprojModel(pkgFolderItem.filePath);
    return model.packages.map(
      p =>
        new SolutionTreeItem(
          p.name,
          'package-item',
          vscode.TreeItemCollapsibleState.None,
          {
            description: p.version,
            filePath: pkgFolderItem.filePath
          }
        )
    );
  }

  private async getProjectReferencesChildren(prFolderItem: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!prFolderItem.filePath) {
      return [];
    }
    const model = await this.getCsprojModel(prFolderItem.filePath);
    return model.projectReferences.map(
      pr =>
        new SolutionTreeItem(
          pr.projectName,
          'project-ref-item',
          vscode.TreeItemCollapsibleState.None,
          {
            filePath: path.resolve(path.dirname(prFolderItem.filePath!), pr.includePath)
          }
        )
    );
  }

  private async getFolderChildren(folderItem: SolutionTreeItem): Promise<SolutionTreeItem[]> {
    if (!folderItem.filePath) {
      return [];
    }
    return await this.getDirectoryItems(folderItem.filePath, folderItem.projectPath);
  }

  private async getDirectoryItems(dirPath: string, rootProjPath?: string): Promise<SolutionTreeItem[]> {
    const ignored = new Set(['bin', 'obj', '.git', '.vs', '.vscode', 'node_modules', '.idea']);
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const items: SolutionTreeItem[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') || ignored.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        items.push(
          new SolutionTreeItem(
            entry.name,
            'folder',
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              filePath: fullPath,
              projectPath: rootProjPath
            }
          )
        );
      } else if (entry.isFile()) {
        // Skip .csproj file itself in root of project since project node already represents it
        if (entry.name.endsWith('.csproj')) {
          continue;
        }
        items.push(
          new SolutionTreeItem(
            entry.name,
            'file',
            vscode.TreeItemCollapsibleState.None,
            {
              filePath: fullPath,
              projectPath: rootProjPath
            }
          )
        );
      }
    }

    // Sort: folders first, then files
    return items.sort((a, b) => {
      if (a.itemType === 'folder' && b.itemType !== 'folder') return -1;
      if (a.itemType !== 'folder' && b.itemType === 'folder') return 1;
      return (a.label as string).localeCompare(b.label as string);
    });
  }

  public async getCsprojModel(filePath: string): Promise<CsprojModel> {
    if (this.parsedProjectsCache.has(filePath)) {
      return this.parsedProjectsCache.get(filePath)!;
    }
    const model = await CsprojParser.parse(filePath);
    this.parsedProjectsCache.set(filePath, model);
    return model;
  }
}
