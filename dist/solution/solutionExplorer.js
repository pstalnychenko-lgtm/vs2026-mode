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
exports.SolutionExplorerProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const slnParser_1 = require("./slnParser");
const csprojParser_1 = require("./csprojParser");
const solutionTreeItem_1 = require("./solutionTreeItem");
class SolutionExplorerProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    currentSolution = null;
    standaloneProjects = [];
    parsedProjectsCache = new Map();
    constructor() {
        this.refresh();
    }
    refresh() {
        this.currentSolution = null;
        this.standaloneProjects = [];
        this.parsedProjectsCache.clear();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return [
                new solutionTreeItem_1.SolutionTreeItem('No folder or solution open', 'file', vscode.TreeItemCollapsibleState.None)
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
    async getRootElements() {
        const slnFiles = await vscode.workspace.findFiles('**/*.{sln,slnx}', '**/node_modules/**', 5);
        if (slnFiles.length > 0) {
            const slnUri = slnFiles[0];
            try {
                this.currentSolution = await slnParser_1.SlnParser.parse(slnUri.fsPath);
                const count = this.currentSolution.projects.filter(p => !p.isSolutionFolder).length;
                return [
                    new solutionTreeItem_1.SolutionTreeItem(`Solution '${this.currentSolution.name}' (${count} project${count === 1 ? '' : 's'})`, 'solution', vscode.TreeItemCollapsibleState.Expanded, { filePath: this.currentSolution.filePath })
                ];
            }
            catch (err) {
                console.error('Error parsing solution file:', err);
            }
        }
        // Fallback: check for C# (.csproj), Python (pyproject.toml, requirements.txt), Java (pom.xml), or Node (package.json)
        const csprojFiles = await vscode.workspace.findFiles('**/*.csproj', '**/node_modules/**', 20);
        const items = [];
        for (const csprojUri of csprojFiles) {
            try {
                const model = await this.getCsprojModel(csprojUri.fsPath);
                items.push(new solutionTreeItem_1.SolutionTreeItem(model.name, 'project', vscode.TreeItemCollapsibleState.Collapsed, {
                    filePath: model.filePath,
                    projectPath: model.directory,
                    description: `[${model.targetFramework}]`
                }));
            }
            catch (err) {
                console.error('Error parsing csproj file:', err);
            }
        }
        // Python Project detection
        const pyReqs = await vscode.workspace.findFiles('**/requirements.txt', '**/node_modules/**', 5);
        for (const pyUri of pyReqs) {
            const dir = path.dirname(pyUri.fsPath);
            const name = path.basename(dir);
            items.push(new solutionTreeItem_1.SolutionTreeItem(`Python Project: ${name}`, 'project', vscode.TreeItemCollapsibleState.Collapsed, {
                filePath: pyUri.fsPath,
                projectPath: dir,
                description: '[Python]'
            }));
        }
        // Java Project detection (pom.xml)
        const pomFiles = await vscode.workspace.findFiles('**/pom.xml', '**/node_modules/**', 5);
        for (const pomUri of pomFiles) {
            const dir = path.dirname(pomUri.fsPath);
            const name = path.basename(dir);
            items.push(new solutionTreeItem_1.SolutionTreeItem(`Java Maven Project: ${name}`, 'project', vscode.TreeItemCollapsibleState.Collapsed, {
                filePath: pomUri.fsPath,
                projectPath: dir,
                description: '[Java Maven]'
            }));
        }
        if (items.length === 0) {
            return [
                new solutionTreeItem_1.SolutionTreeItem('No .sln or .csproj files found', 'file', vscode.TreeItemCollapsibleState.None)
            ];
        }
        return items;
    }
    async getSolutionProjects(solutionItem) {
        if (!this.currentSolution) {
            return [];
        }
        const items = [];
        for (const proj of this.currentSolution.projects) {
            if (proj.isSolutionFolder) {
                continue;
            }
            try {
                const model = await this.getCsprojModel(proj.absolutePath);
                items.push(new solutionTreeItem_1.SolutionTreeItem(model.name, 'project', vscode.TreeItemCollapsibleState.Collapsed, {
                    filePath: model.filePath,
                    projectPath: model.directory,
                    description: `[${model.targetFramework}]`
                }));
            }
            catch {
                items.push(new solutionTreeItem_1.SolutionTreeItem(proj.name, 'project', vscode.TreeItemCollapsibleState.Collapsed, {
                    filePath: proj.absolutePath,
                    projectPath: path.dirname(proj.absolutePath)
                }));
            }
        }
        return items;
    }
    async getProjectChildren(projectItem) {
        if (!projectItem.filePath) {
            return [];
        }
        const projectDir = projectItem.projectPath || path.dirname(projectItem.filePath);
        const items = [];
        // Dependencies node
        items.push(new solutionTreeItem_1.SolutionTreeItem('Dependencies', 'dependencies', vscode.TreeItemCollapsibleState.Collapsed, {
            filePath: projectItem.filePath,
            projectPath: projectDir
        }));
        // List files and directories inside projectDir
        const dirItems = await this.getDirectoryItems(projectDir, projectItem.filePath);
        return items.concat(dirItems);
    }
    async getDependenciesChildren(depItem) {
        if (!depItem.filePath) {
            return [];
        }
        const model = await this.getCsprojModel(depItem.filePath);
        const items = [];
        if (model.packages.length > 0) {
            items.push(new solutionTreeItem_1.SolutionTreeItem(`Packages (${model.packages.length})`, 'packages-folder', vscode.TreeItemCollapsibleState.Collapsed, {
                filePath: depItem.filePath,
                projectPath: depItem.projectPath
            }));
        }
        if (model.projectReferences.length > 0) {
            items.push(new solutionTreeItem_1.SolutionTreeItem(`Projects (${model.projectReferences.length})`, 'projects-folder', vscode.TreeItemCollapsibleState.Collapsed, {
                filePath: depItem.filePath,
                projectPath: depItem.projectPath
            }));
        }
        return items;
    }
    async getPackagesChildren(pkgFolderItem) {
        if (!pkgFolderItem.filePath) {
            return [];
        }
        const model = await this.getCsprojModel(pkgFolderItem.filePath);
        return model.packages.map(p => new solutionTreeItem_1.SolutionTreeItem(p.name, 'package-item', vscode.TreeItemCollapsibleState.None, {
            description: p.version,
            filePath: pkgFolderItem.filePath
        }));
    }
    async getProjectReferencesChildren(prFolderItem) {
        if (!prFolderItem.filePath) {
            return [];
        }
        const model = await this.getCsprojModel(prFolderItem.filePath);
        return model.projectReferences.map(pr => new solutionTreeItem_1.SolutionTreeItem(pr.projectName, 'project-ref-item', vscode.TreeItemCollapsibleState.None, {
            filePath: path.resolve(path.dirname(prFolderItem.filePath), pr.includePath)
        }));
    }
    async getFolderChildren(folderItem) {
        if (!folderItem.filePath) {
            return [];
        }
        return await this.getDirectoryItems(folderItem.filePath, folderItem.projectPath);
    }
    async getDirectoryItems(dirPath, rootProjPath) {
        const ignored = new Set(['bin', 'obj', '.git', '.vs', '.vscode', 'node_modules', '.idea']);
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const items = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.') || ignored.has(entry.name)) {
                continue;
            }
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                items.push(new solutionTreeItem_1.SolutionTreeItem(entry.name, 'folder', vscode.TreeItemCollapsibleState.Collapsed, {
                    filePath: fullPath,
                    projectPath: rootProjPath
                }));
            }
            else if (entry.isFile()) {
                // Skip .csproj file itself in root of project since project node already represents it
                if (entry.name.endsWith('.csproj')) {
                    continue;
                }
                items.push(new solutionTreeItem_1.SolutionTreeItem(entry.name, 'file', vscode.TreeItemCollapsibleState.None, {
                    filePath: fullPath,
                    projectPath: rootProjPath
                }));
            }
        }
        // Sort: folders first, then files
        return items.sort((a, b) => {
            if (a.itemType === 'folder' && b.itemType !== 'folder')
                return -1;
            if (a.itemType !== 'folder' && b.itemType === 'folder')
                return 1;
            return a.label.localeCompare(b.label);
        });
    }
    async getCsprojModel(filePath) {
        if (this.parsedProjectsCache.has(filePath)) {
            return this.parsedProjectsCache.get(filePath);
        }
        const model = await csprojParser_1.CsprojParser.parse(filePath);
        this.parsedProjectsCache.set(filePath, model);
        return model;
    }
}
exports.SolutionExplorerProvider = SolutionExplorerProvider;
//# sourceMappingURL=solutionExplorer.js.map