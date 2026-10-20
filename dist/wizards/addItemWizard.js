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
exports.AddItemWizard = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const templates_1 = require("./templates");
const namespaceResolver_1 = require("./namespaceResolver");
class AddItemWizard {
    static async show(target, preselectedTemplateId) {
        const targetDir = await this.resolveTargetDirectory(target);
        if (!targetDir) {
            vscode.window.showErrorMessage('Could not determine destination folder for the new item.');
            return;
        }
        let selectedTemplate;
        if (preselectedTemplateId) {
            selectedTemplate = templates_1.ITEM_TEMPLATES.find(t => t.id === preselectedTemplateId);
        }
        if (!selectedTemplate) {
            const picks = templates_1.ITEM_TEMPLATES.map(t => ({
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
            validateInput: (val) => {
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
        const { namespace } = await namespaceResolver_1.NamespaceResolver.resolve(targetDir);
        const config = vscode.workspace.getConfiguration('vs2026');
        const fileScoped = config.get('fileScopedNamespaces', true);
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
    static async resolveTargetDirectory(target) {
        if (target instanceof vscode.Uri) {
            try {
                const stat = await fs.promises.stat(target.fsPath);
                return stat.isDirectory() ? target.fsPath : path.dirname(target.fsPath);
            }
            catch {
                return path.dirname(target.fsPath);
            }
        }
        if (target && 'filePath' in target && target.filePath) {
            try {
                const stat = await fs.promises.stat(target.filePath);
                return stat.isDirectory() ? target.filePath : path.dirname(target.filePath);
            }
            catch {
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
exports.AddItemWizard = AddItemWizard;
//# sourceMappingURL=addItemWizard.js.map