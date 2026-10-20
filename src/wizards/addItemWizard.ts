import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ITEM_TEMPLATES, ItemTemplate } from './templates';
import { NamespaceResolver } from './namespaceResolver';
import { SolutionTreeItem } from '../solution/solutionTreeItem';

export class AddItemWizard {
  public static async show(target?: vscode.Uri | SolutionTreeItem, preselectedTemplateId?: string): Promise<void> {
    const targetDir = await this.resolveTargetDirectory(target);
    if (!targetDir) {
      vscode.window.showErrorMessage('Could not determine destination folder for the new item.');
      return;
    }

    let selectedTemplate: ItemTemplate | undefined;

    if (preselectedTemplateId) {
      selectedTemplate = ITEM_TEMPLATES.find(t => t.id === preselectedTemplateId);
    }

    if (!selectedTemplate) {
      const picks = ITEM_TEMPLATES.map(t => ({
        label: t.label,
        description: t.description,
        detail: t.detail,
        template: t
      }));

      const chosen = await vscode.window.showQuickPick(picks, {
        placeHolder: 'Visual Studio 2026: Select Item Template',
        title: 'Add New Item'
      });

      if (!chosen) {
        return;
      }
      selectedTemplate = chosen.template;
    }

    // Prompt for file name
    const inputName = await vscode.window.showInputBox({
      prompt: `Enter name for the new ${selectedTemplate.label.replace(/\$\([^)]+\)\s*/, '')}`,
      value: selectedTemplate.defaultFileName,
      valueSelection: [0, selectedTemplate.defaultFileName.lastIndexOf('.')],
      title: 'Visual Studio 2026: Add New Item',
      validateInput: (val: string) => {
        if (!val || val.trim().length === 0) {
          return 'Item name cannot be empty.';
        }
        if (/[<>:"/\\|?*]/.test(val)) {
          return 'Name contains invalid characters.';
        }
        return null;
      }
    });

    if (!inputName) {
      return;
    }

    let fileName = inputName.trim();
    if (!fileName.includes('.')) {
      fileName = `${fileName}.cs`;
    }

    const itemName = fileName.replace(/\.[^/.]+$/, '');
    const finalFilePath = path.join(targetDir, fileName);

    // Check if already exists
    if (fs.existsSync(finalFilePath)) {
      vscode.window.showErrorMessage(`File '${fileName}' already exists in this folder!`);
      return;
    }

    // Resolve namespace
    const { namespace } = await NamespaceResolver.resolve(targetDir);

    const config = vscode.workspace.getConfiguration('vs2026');
    const fileScoped = config.get<boolean>('fileScopedNamespaces', true);

    const content = selectedTemplate.generateContent(namespace, itemName, fileScoped);

    // Ensure dir exists
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.writeFile(finalFilePath, content, 'utf8');

    // Open file in editor
    const doc = await vscode.workspace.openTextDocument(finalFilePath);
    const editor = await vscode.window.showTextDocument(doc);

    // Position cursor inside class body
    const lineCount = doc.lineCount;
    for (let i = 0; i < lineCount; i++) {
      const line = doc.lineAt(i).text;
      if (line.includes('{') && i > 0) {
        const targetLine = Math.min(i + 1, lineCount - 1);
        const pos = new vscode.Position(targetLine, 4);
        editor.selection = new vscode.Selection(pos, pos);
        break;
      }
    }

    vscode.window.showInformationMessage(`Visual Studio 2026: Created '${fileName}' in namespace '${namespace}'.`);
  }

  private static async resolveTargetDirectory(target?: vscode.Uri | SolutionTreeItem): Promise<string | undefined> {
    if (target instanceof vscode.Uri) {
      try {
        const stat = await fs.promises.stat(target.fsPath);
        return stat.isDirectory() ? target.fsPath : path.dirname(target.fsPath);
      } catch {
        return path.dirname(target.fsPath);
      }
    }

    if (target && 'filePath' in target && target.filePath) {
      try {
        const stat = await fs.promises.stat(target.filePath);
        return stat.isDirectory() ? target.filePath : path.dirname(target.filePath);
      } catch {
        return target.projectPath || path.dirname(target.filePath);
      }
    }

    // Check active editor
    if (vscode.window.activeTextEditor) {
      return path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
    }

    // Check workspace folders
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }

    return undefined;
  }
}
