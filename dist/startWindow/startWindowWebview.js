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
exports.StartWindowWebview = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
class StartWindowWebview {
    context;
    static currentPanel;
    _panel;
    _disposables = [];
    static show(context) {
        if (StartWindowWebview.currentPanel) {
            StartWindowWebview.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }
        const panel = vscode.window.createWebviewPanel('vs2026StartWindow', 'Visual Studio 2026: Create Project', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        StartWindowWebview.currentPanel = new StartWindowWebview(panel, context);
    }
    constructor(panel, context) {
        this.context = context;
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'openFolder':
                    await vscode.commands.executeCommand('vscode.openFolder');
                    break;
                case 'cloneRepo':
                    await vscode.commands.executeCommand('git.clone');
                    break;
                case 'createProject':
                    await this.handleCreateProject(message.templateId, message.name, message.destFolder, message.framework);
                    break;
            }
        }, null, this._disposables);
        this.renderHtml();
    }
    async handleCreateProject(templateId, name, destFolder, framework) {
        if (!name || !destFolder) {
            vscode.window.showErrorMessage('Please specify project name and target directory.');
            return;
        }
        const targetDir = path.join(destFolder, name);
        await fs.promises.mkdir(targetDir, { recursive: true });
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Visual Studio 2026: Generating ${name}...`,
            cancellable: false
        }, async (progress) => {
            try {
                if (templateId === 'dotnet-clean-app') {
                    // Full Clean Architecture Solution
                    await this.generateDotnetCleanApp(targetDir, name, framework || 'net8.0');
                }
                else if (templateId === 'dotnet-console') {
                    await this.runCmd(`dotnet new console -n "${name}" -f ${framework || 'net8.0'}`, targetDir);
                }
                else if (templateId === 'dotnet-classlib') {
                    await this.runCmd(`dotnet new classlib -n "${name}" -f ${framework || 'net8.0'}`, targetDir);
                }
                else if (templateId === 'dotnet-worker') {
                    await this.runCmd(`dotnet new worker -n "${name}" -f ${framework || 'net8.0'}`, targetDir);
                }
                else if (templateId === 'asp-webapi') {
                    await this.runCmd(`dotnet new webapi -n "${name}" -f ${framework || 'net8.0'}`, targetDir);
                }
                else if (templateId === 'asp-mvc') {
                    await this.runCmd(`dotnet new mvc -n "${name}" -f ${framework || 'net8.0'}`, targetDir);
                }
                else if (templateId === 'asp-blazor') {
                    await this.runCmd(`dotnet new blazor -n "${name}" -f ${framework || 'net8.0'}`, targetDir);
                }
                else if (templateId === 'asp-minimal') {
                    await this.runCmd(`dotnet new webapi -n "${name}" -f ${framework || 'net8.0'} --use-minimal-apis`, targetDir);
                }
                else if (templateId === 'py-console') {
                    await this.generatePyConsole(targetDir, name);
                }
                else if (templateId === 'py-clean') {
                    await this.generatePyClean(targetDir, name);
                }
                else if (templateId === 'py-fastapi') {
                    await this.generatePyFastAPI(targetDir, name);
                }
                else if (templateId === 'java-console') {
                    await this.generateJavaConsole(targetDir, name);
                }
                else if (templateId === 'java-clean') {
                    await this.generateJavaClean(targetDir, name);
                }
                else if (templateId === 'cpp-console') {
                    await this.generateCppConsole(targetDir, name);
                }
                else if (templateId === 'swift-console') {
                    await this.generateSwiftConsole(targetDir, name);
                }
                else if (templateId === 'swift-clean') {
                    await this.generateSwiftClean(targetDir, name);
                }
                else if (templateId === 'go-console') {
                    await this.generateGoConsole(targetDir, name);
                }
                else if (templateId === 'go-clean') {
                    await this.generateGoClean(targetDir, name);
                }
                else if (templateId === 'go-webapi') {
                    await this.generateGoWebApi(targetDir, name);
                }
                else if (templateId === 'rust-console') {
                    await this.generateRustConsole(targetDir, name);
                }
                else if (templateId === 'rust-clean') {
                    await this.generateRustClean(targetDir, name);
                }
                else if (templateId === 'node-console') {
                    await this.generateNodeConsole(targetDir, name);
                }
                vscode.window.showInformationMessage(`Visual Studio 2026: Successfully created '${name}'!`);
                await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetDir));
            }
            catch (err) {
                vscode.window.showErrorMessage(`Project creation failed: ${err.message || err}`);
            }
        });
    }
    runCmd(cmd, cwd) {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(cmd, { cwd }, (err, stdout, stderr) => {
                if (err)
                    reject(new Error(stderr || err.message));
                else
                    resolve(stdout);
            });
        });
    }
    async generateDotnetCleanApp(targetDir, solutionName, framework) {
        // 1. Solution
        await this.runCmd(`dotnet new sln -n "${solutionName}"`, targetDir);
        const srcDir = path.join(targetDir, 'src');
        await fs.promises.mkdir(srcDir, { recursive: true });
        // 2. Domain (Core entities)
        await this.runCmd(`dotnet new classlib -n "${solutionName}.Domain" -f ${framework} -o "src/${solutionName}.Domain"`, targetDir);
        const domainEntity = `namespace ${solutionName}.Domain.Entities;\n\npublic class BaseEntity\n{\n    public Guid Id { get; set; } = Guid.NewGuid();\n    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;\n}\n`;
        await fs.promises.mkdir(path.join(srcDir, `${solutionName}.Domain`, 'Entities'), { recursive: true });
        await fs.promises.writeFile(path.join(srcDir, `${solutionName}.Domain`, 'Entities', 'BaseEntity.cs'), domainEntity, 'utf8');
        // 3. Application (CQRS, Interfaces, Services)
        await this.runCmd(`dotnet new classlib -n "${solutionName}.Application" -f ${framework} -o "src/${solutionName}.Application"`, targetDir);
        await this.runCmd(`dotnet add "src/${solutionName}.Application" reference "src/${solutionName}.Domain/${solutionName}.Domain.csproj"`, targetDir);
        // 4. Infrastructure (Data, Repositories)
        await this.runCmd(`dotnet new classlib -n "${solutionName}.Infrastructure" -f ${framework} -o "src/${solutionName}.Infrastructure"`, targetDir);
        await this.runCmd(`dotnet add "src/${solutionName}.Infrastructure" reference "src/${solutionName}.Application/${solutionName}.Application.csproj"`, targetDir);
        // 5. WebApi (Presentation, Controllers, Swagger)
        await this.runCmd(`dotnet new webapi -n "${solutionName}.WebApi" -f ${framework} -o "src/${solutionName}.WebApi"`, targetDir);
        await this.runCmd(`dotnet add "src/${solutionName}.WebApi" reference "src/${solutionName}.Infrastructure/${solutionName}.Infrastructure.csproj"`, targetDir);
        // 6. Add all to SLN
        await this.runCmd(`dotnet sln add "src/${solutionName}.Domain/${solutionName}.Domain.csproj"`, targetDir);
        await this.runCmd(`dotnet sln add "src/${solutionName}.Application/${solutionName}.Application.csproj"`, targetDir);
        await this.runCmd(`dotnet sln add "src/${solutionName}.Infrastructure/${solutionName}.Infrastructure.csproj"`, targetDir);
        await this.runCmd(`dotnet sln add "src/${solutionName}.WebApi/${solutionName}.WebApi.csproj"`, targetDir);
        // Readme
        const readme = `# ${solutionName} (Clean Architecture)\n\nGenerated by Visual Studio 2026 Mode.\n\n### Projects Structure:\n- **Domain**: Enterprise business rules & entities\n- **Application**: Application business rules, DTOs, interfaces\n- **Infrastructure**: External concerns, database, persistence\n- **WebApi**: API Presentation layer\n`;
        await fs.promises.writeFile(path.join(targetDir, 'README.md'), readme, 'utf8');
    }
    async generatePyConsole(targetDir, name) {
        const mainPy = `\"\"\"\n${name} - Python Console App\nVisual Studio 2026\n\"\"\"\n\ndef main():\n    print("Hello from ${name} Console App!")\n\nif __name__ == '__main__':\n    main()\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.py'), mainPy, 'utf8');
        await fs.promises.writeFile(path.join(targetDir, 'requirements.txt'), '# Dependencies\n', 'utf8');
    }
    async generatePyClean(targetDir, name) {
        const dirs = ['domain', 'services', 'adapters', 'tests'];
        for (const d of dirs) {
            const p = path.join(targetDir, 'src', d);
            await fs.promises.mkdir(p, { recursive: true });
            await fs.promises.writeFile(path.join(p, '__init__.py'), '', 'utf8');
        }
        const mainPy = `from src.services.app_service import AppService\n\ndef main():\n    service = AppService()\n    service.run()\n\nif __name__ == '__main__':\n    main()\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.py'), mainPy, 'utf8');
        const servicePy = `class AppService:\n    def run(self):\n        print("Clean Architecture Python Service Running")\n`;
        await fs.promises.writeFile(path.join(targetDir, 'src', 'services', 'app_service.py'), servicePy, 'utf8');
        await fs.promises.writeFile(path.join(targetDir, 'requirements.txt'), 'pytest>=8.0.0\n', 'utf8');
    }
    async generatePyFastAPI(targetDir, name) {
        const appPy = `from fastapi import FastAPI\n\napp = FastAPI(title="${name}", version="1.0.0")\n\n@app.get("/")\ndef read_root():\n    return {"message": "Welcome to ${name} API in Visual Studio 2026"}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.py'), appPy, 'utf8');
        await fs.promises.writeFile(path.join(targetDir, 'requirements.txt'), 'fastapi>=0.110.0\nuvicorn>=0.28.0\n', 'utf8');
    }
    async generateJavaConsole(targetDir, name) {
        const srcDir = path.join(targetDir, 'src', 'main', 'java', 'com', 'example');
        await fs.promises.mkdir(srcDir, { recursive: true });
        const appJava = `package com.example;\n\npublic class App {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${name} Console App!");\n    }\n}\n`;
        await fs.promises.writeFile(path.join(srcDir, 'App.java'), appJava, 'utf8');
        const pomXml = `<project xmlns="http://maven.apache.org/POM/4.0.0"\n  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example</groupId>\n  <artifactId>${name}</artifactId>\n  <version>1.0-SNAPSHOT</version>\n  <properties>\n    <maven.compiler.source>21</maven.compiler.source>\n    <maven.compiler.target>21</maven.compiler.target>\n  </properties>\n</project>\n`;
        await fs.promises.writeFile(path.join(targetDir, 'pom.xml'), pomXml, 'utf8');
    }
    async generateJavaClean(targetDir, name) {
        const pkg = path.join(targetDir, 'src', 'main', 'java', 'com', 'example');
        for (const d of ['domain', 'application', 'infrastructure']) {
            await fs.promises.mkdir(path.join(pkg, d), { recursive: true });
        }
        const appJava = `package com.example;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("${name} Clean Architecture Java Initialized");\n    }\n}\n`;
        await fs.promises.writeFile(path.join(pkg, 'Main.java'), appJava, 'utf8');
        const pomXml = `<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>${name}</artifactId><version>1.0-SNAPSHOT</version></project>`;
        await fs.promises.writeFile(path.join(targetDir, 'pom.xml'), pomXml, 'utf8');
    }
    async generateCppConsole(targetDir, name) {
        const mainCpp = `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${name} C++ Console App!" << std::endl;\n    return 0;\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.cpp'), mainCpp, 'utf8');
        const cmake = `cmake_minimum_required(VERSION 3.10)\nproject(${name})\nset(CMAKE_CXX_STANDARD 17)\nadd_executable(${name} main.cpp)\n`;
        await fs.promises.writeFile(path.join(targetDir, 'CMakeLists.txt'), cmake, 'utf8');
    }
    async generateNodeConsole(targetDir, name) {
        const pkgJson = `{\n  "name": "${name.toLowerCase()}",\n  "version": "1.0.0",\n  "main": "dist/index.js",\n  "scripts": {\n    "build": "tsc",\n    "start": "node dist/index.js"\n  }\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'package.json'), pkgJson, 'utf8');
        const indexTs = `console.log("Hello from ${name} (Node / TypeScript) Console App!");\n`;
        await fs.promises.mkdir(path.join(targetDir, 'src'), { recursive: true });
        await fs.promises.writeFile(path.join(targetDir, 'src', 'index.ts'), indexTs, 'utf8');
    }
    async generateSwiftConsole(targetDir, name) {
        const packageSwift = `// swift-tools-version: 5.9\nimport PackageDescription\n\nlet package = Package(\n    name: "${name}",\n    targets: [\n        .executableTarget(\n            name: "${name}",\n            path: "Sources")\n    ]\n)\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Package.swift'), packageSwift, 'utf8');
        const sourcesDir = path.join(targetDir, 'Sources');
        await fs.promises.mkdir(sourcesDir, { recursive: true });
        const mainSwift = `import Foundation\n\nprint("Hello from ${name} (Swift Console App) in Visual Studio 2026!")\n`;
        await fs.promises.writeFile(path.join(sourcesDir, 'main.swift'), mainSwift, 'utf8');
        await fs.promises.writeFile(path.join(targetDir, 'README.md'), `# ${name}\n\nSwift Console Application generated by Visual Studio 2026.\n\nRun with:\n\`\`\`bash\nswift run\n\`\`\`\n`, 'utf8');
    }
    async generateSwiftClean(targetDir, name) {
        const packageSwift = `// swift-tools-version: 5.9\nimport PackageDescription\n\nlet package = Package(\n    name: "${name}",\n    targets: [\n        .executableTarget(\n            name: "${name}",\n            path: "Sources")\n    ]\n)\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Package.swift'), packageSwift, 'utf8');
        const dirs = ['Domain', 'Services'];
        for (const d of dirs) {
            await fs.promises.mkdir(path.join(targetDir, 'Sources', d), { recursive: true });
        }
        const entitySwift = `import Foundation\n\npublic struct User: Identifiable, Codable {\n    public let id: UUID\n    public var name: String\n\n    public init(id: UUID = UUID(), name: String) {\n        self.id = id\n        self.name = name\n    }\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Sources', 'Domain', 'User.swift'), entitySwift, 'utf8');
        const serviceSwift = `import Foundation\n\npublic class UserService {\n    public init() {}\n    public func getWelcomeMessage() -> String {\n        return "Welcome to ${name} Clean Architecture (Swift)!"\n    }\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Sources', 'Services', 'UserService.swift'), serviceSwift, 'utf8');
        const mainSwift = `import Foundation\n\nlet service = UserService()\nprint(service.getWelcomeMessage())\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Sources', 'main.swift'), mainSwift, 'utf8');
    }
    async generateGoConsole(targetDir, name) {
        const modName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const goMod = `module ${modName}\n\ngo 1.22\n`;
        await fs.promises.writeFile(path.join(targetDir, 'go.mod'), goMod, 'utf8');
        const mainGo = `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from ${name} (Go Console App) in Visual Studio 2026!")\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.go'), mainGo, 'utf8');
        await fs.promises.writeFile(path.join(targetDir, 'README.md'), `# ${name}\n\nGo Console Application generated by Visual Studio 2026.\n\nRun with:\n\`\`\`bash\ngo run .\n\`\`\`\n`, 'utf8');
    }
    async generateGoClean(targetDir, name) {
        const modName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const goMod = `module ${modName}\n\ngo 1.22\n`;
        await fs.promises.writeFile(path.join(targetDir, 'go.mod'), goMod, 'utf8');
        const cmdDir = path.join(targetDir, 'cmd', 'app');
        const domainDir = path.join(targetDir, 'internal', 'domain');
        const serviceDir = path.join(targetDir, 'internal', 'service');
        for (const d of [cmdDir, domainDir, serviceDir]) {
            await fs.promises.mkdir(d, { recursive: true });
        }
        const domainGo = `package domain\n\ntype User struct {\n    ID   string \`json:"id"\`\n    Name string \`json:"name"\`\n}\n`;
        await fs.promises.writeFile(path.join(domainDir, 'user.go'), domainGo, 'utf8');
        const serviceGo = `package service\n\ntype UserService struct{}\n\nfunc NewUserService() *UserService {\n    return &UserService{}\n}\n\nfunc (s *UserService) Welcome() string {\n    return "Hello from ${name} Clean Architecture (Go)!"\n}\n`;
        await fs.promises.writeFile(path.join(serviceDir, 'user_service.go'), serviceGo, 'utf8');
        const rootMain = `package main\n\nimport (\n    "fmt"\n    "${modName}/internal/service"\n)\n\nfunc main() {\n    svc := service.NewUserService()\n    fmt.Println(svc.Welcome())\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.go'), rootMain, 'utf8');
        await fs.promises.writeFile(path.join(cmdDir, 'main.go'), rootMain, 'utf8');
    }
    async generateGoWebApi(targetDir, name) {
        const modName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const goMod = `module ${modName}\n\ngo 1.22\n`;
        await fs.promises.writeFile(path.join(targetDir, 'go.mod'), goMod, 'utf8');
        const mainGo = `package main\n\nimport (\n    "encoding/json"\n    "fmt"\n    "log"\n    "net/http"\n)\n\ntype Response struct {\n    Message string \`json:"message"\`\n    Status  string \`json:"status"\`\n}\n\nfunc handleRoot(w http.ResponseWriter, r *http.Request) {\n    w.Header().Set("Content-Type", "application/json")\n    json.NewEncoder(w).Encode(Response{\n        Message: "Welcome to ${name} Web API (Visual Studio 2026)",\n        Status:  "OK",\n    })\n}\n\nfunc main() {\n    http.HandleFunc("/api/health", handleRoot)\n    http.HandleFunc("/", handleRoot)\n    fmt.Println("${name} Web API running on http://localhost:8080")\n    log.Fatal(http.ListenAndServe(":8080", nil))\n}\n`;
        await fs.promises.writeFile(path.join(targetDir, 'main.go'), mainGo, 'utf8');
    }
    async generateRustConsole(targetDir, name) {
        const cargoToml = `[package]\nname = "${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Cargo.toml'), cargoToml, 'utf8');
        const srcDir = path.join(targetDir, 'src');
        await fs.promises.mkdir(srcDir, { recursive: true });
        const mainRs = `fn main() {\n    println!("Hello from ${name} (Rust Console App) in Visual Studio 2026!");\n}\n`;
        await fs.promises.writeFile(path.join(srcDir, 'main.rs'), mainRs, 'utf8');
    }
    async generateRustClean(targetDir, name) {
        const cargoToml = `[package]\nname = "${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n`;
        await fs.promises.writeFile(path.join(targetDir, 'Cargo.toml'), cargoToml, 'utf8');
        const srcDir = path.join(targetDir, 'src');
        await fs.promises.mkdir(srcDir, { recursive: true });
        const domainRs = `pub struct User {\n    pub id: String,\n    pub name: String,\n}\n\nimpl User {\n    pub fn new(id: &str, name: &str) -> Self {\n        Self {\n            id: id.to_string(),\n            name: name.to_string(),\n        }\n    }\n}\n`;
        await fs.promises.writeFile(path.join(srcDir, 'domain.rs'), domainRs, 'utf8');
        const serviceRs = `use crate::domain::User;\n\npub struct UserService;\n\nimpl UserService {\n    pub fn get_user() -> User {\n        User::new("1", "VS 2026 User")\n    }\n}\n`;
        await fs.promises.writeFile(path.join(srcDir, 'service.rs'), serviceRs, 'utf8');
        const mainRs = `mod domain;\nmod service;\n\nuse service::UserService;\n\nfn main() {\n    let user = UserService::get_user();\n    println!("Hello {} from ${name} Clean Architecture (Rust)!", user.name);\n}\n`;
        await fs.promises.writeFile(path.join(srcDir, 'main.rs'), mainRs, 'utf8');
    }
    renderHtml() {
        const defaultDir = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : path.join(os.homedir(), 'Projects');
        this._panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Visual Studio 2026: Create Project</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 24px 36px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-foreground);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 2px solid #68217A;
      padding-bottom: 12px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #68217A;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .category-tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
    }
    .cat-btn {
      background: none;
      border: 1px solid transparent;
      padding: 6px 14px;
      border-radius: 3px;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    }
    .cat-btn.active {
      background: #68217A;
      color: white;
    }
    .search-filter {
      margin-bottom: 16px;
      width: 100%;
    }
    .search-filter input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
    }
    .grid-container {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }
    .templates-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 6px;
    }
    .template-card {
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
      border-radius: 4px;
      padding: 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.15s ease-in-out;
    }
    .template-card:hover {
      border-color: #68217A;
      background: var(--vscode-list-hoverBackground);
      transform: translateY(-1px);
    }
    .template-card.selected {
      border-color: #68217A;
      box-shadow: 0 0 0 2px #68217A;
      background: var(--vscode-list-activeSelectionBackground);
    }
    .template-title {
      font-size: 14px;
      font-weight: 700;
      color: #569CD6;
    }
    .template-badge {
      font-size: 11px;
      background: #2D2D30;
      color: #B8D7A3;
      padding: 2px 6px;
      border-radius: 2px;
      align-self: flex-start;
    }
    .template-desc {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
    }
    .config-sidebar {
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    label {
      font-size: 12px;
      font-weight: 600;
    }
    input[type="text"], select {
      padding: 8px 10px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
    }
    button.btn-create {
      background: #68217A;
      color: white;
      border: none;
      padding: 12px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 2px;
      cursor: pointer;
      margin-top: 10px;
    }
    button.btn-create:hover {
      background: #8540A6;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🟣 Visual Studio 2026 : New Project</div>
    <div style="font-size:12px; color:var(--vscode-descriptionForeground);">Select Template & Configure Solution</div>
  </div>

  <div class="category-tabs">
    <button class="cat-btn active" onclick="filterCat('all')">All</button>
    <button class="cat-btn" onclick="filterCat('dotnet')">.NET (C#)</button>
    <button class="cat-btn" onclick="filterCat('asp')">ASP.NET Core</button>
    <button class="cat-btn" onclick="filterCat('swift')">Swift</button>
    <button class="cat-btn" onclick="filterCat('go')">Go</button>
    <button class="cat-btn" onclick="filterCat('rust')">Rust</button>
    <button class="cat-btn" onclick="filterCat('python')">Python</button>
    <button class="cat-btn" onclick="filterCat('java')">Java</button>
    <button class="cat-btn" onclick="filterCat('cpp')">C++</button>
    <button class="cat-btn" onclick="filterCat('node')">Node / TS</button>
  </div>

  <div class="search-filter">
    <input type="text" id="searchInput" placeholder="Search templates (e.g. Clean App, Console App, Web API)..." oninput="filterSearch()" />
  </div>

  <div class="grid-container">
    <div class="templates-list" id="templatesContainer">
      <!-- .NET C# -->
      <div class="template-card selected" data-cat="dotnet" data-id="dotnet-clean-app" onclick="selectTemplate(this, 'dotnet-clean-app', 'MyCleanApp')">
        <span class="template-badge">.NET C#</span>
        <div class="template-title">Clean Architecture App ("Клір Апп")</div>
        <div class="template-desc">Multi-project solution: Domain, Application (CQRS/DTOs), Infrastructure, and WebApi with references.</div>
      </div>

      <div class="template-card" data-cat="dotnet" data-id="dotnet-console" onclick="selectTemplate(this, 'dotnet-console', 'MyConsoleApp')">
        <span class="template-badge">.NET C#</span>
        <div class="template-title">Console App (.NET)</div>
        <div class="template-desc">A project for creating a command-line application that runs on Windows, Linux, and macOS.</div>
      </div>

      <div class="template-card" data-cat="dotnet" data-id="dotnet-classlib" onclick="selectTemplate(this, 'dotnet-classlib', 'MyClassLibrary')">
        <span class="template-badge">.NET C#</span>
        <div class="template-title">Class Library (.NET)</div>
        <div class="template-desc">A project for creating a C# class library that targets .NET 10 / .NET 8.</div>
      </div>

      <div class="template-card" data-cat="dotnet" data-id="dotnet-worker" onclick="selectTemplate(this, 'dotnet-worker', 'MyWorkerService')">
        <span class="template-badge">.NET C#</span>
        <div class="template-title">Worker Service (.NET)</div>
        <div class="template-desc">Background processing daemon / Windows Service template.</div>
      </div>

      <!-- ASP.NET Core -->
      <div class="template-card" data-cat="asp" data-id="asp-webapi" onclick="selectTemplate(this, 'asp-webapi', 'MyWebApi')">
        <span class="template-badge">ASP.NET Core</span>
        <div class="template-title">ASP.NET Core Web API</div>
        <div class="template-desc">RESTful HTTP services with Swagger, OpenAPI, and Controller support.</div>
      </div>

      <div class="template-card" data-cat="asp" data-id="asp-minimal" onclick="selectTemplate(this, 'asp-minimal', 'MyMinimalApi')">
        <span class="template-badge">ASP.NET Core</span>
        <div class="template-title">ASP.NET Core Minimal API</div>
        <div class="template-desc">High-performance minimal API endpoints in a single Program.cs file.</div>
      </div>

      <div class="template-card" data-cat="asp" data-id="asp-mvc" onclick="selectTemplate(this, 'asp-mvc', 'MyMvcApp')">
        <span class="template-badge">ASP.NET Core</span>
        <div class="template-title">ASP.NET Core Web App (MVC)</div>
        <div class="template-desc">Model-View-Controller web application with Razor views.</div>
      </div>

      <div class="template-card" data-cat="asp" data-id="asp-blazor" onclick="selectTemplate(this, 'asp-blazor', 'MyBlazorApp')">
        <span class="template-badge">ASP.NET Core</span>
        <div class="template-title">Blazor Web App</div>
        <div class="template-desc">Interactive client-side and server-side web UI with C# instead of JavaScript.</div>
      </div>

      <!-- Swift -->
      <div class="template-card" data-cat="swift" data-id="swift-console" onclick="selectTemplate(this, 'swift-console', 'MySwiftConsole')">
        <span class="template-badge">Swift</span>
        <div class="template-title">Swift Console App (SPM)</div>
        <div class="template-desc">Swift Package Manager command-line application with Package.swift and Sources/main.swift.</div>
      </div>

      <div class="template-card" data-cat="swift" data-id="swift-clean" onclick="selectTemplate(this, 'swift-clean', 'MySwiftCleanApp')">
        <span class="template-badge">Swift</span>
        <div class="template-title">Swift Clean Architecture App</div>
        <div class="template-desc">Structured Swift project with Domain, Services, and Package.swift.</div>
      </div>

      <!-- Go -->
      <div class="template-card" data-cat="go" data-id="go-console" onclick="selectTemplate(this, 'go-console', 'my_go_console')">
        <span class="template-badge">Go</span>
        <div class="template-title">Go Console App</div>
        <div class="template-desc">Standard Go application with go.mod, main.go, and instant single-click execution.</div>
      </div>

      <div class="template-card" data-cat="go" data-id="go-clean" onclick="selectTemplate(this, 'go-clean', 'my_go_clean_app')">
        <span class="template-badge">Go</span>
        <div class="template-title">Go Clean Architecture App</div>
        <div class="template-desc">Enterprise Go structure: cmd/app, internal/domain, internal/service, and go.mod.</div>
      </div>

      <div class="template-card" data-cat="go" data-id="go-webapi" onclick="selectTemplate(this, 'go-webapi', 'my_go_api')">
        <span class="template-badge">Go</span>
        <div class="template-title">Go Web API (REST)</div>
        <div class="template-desc">Fast JSON HTTP REST API service using Go standard library.</div>
      </div>

      <!-- Rust -->
      <div class="template-card" data-cat="rust" data-id="rust-console" onclick="selectTemplate(this, 'rust-console', 'my_rust_console')">
        <span class="template-badge">Rust</span>
        <div class="template-title">Rust Console App (Cargo)</div>
        <div class="template-desc">Standard Rust executable project with Cargo.toml and src/main.rs.</div>
      </div>

      <div class="template-card" data-cat="rust" data-id="rust-clean" onclick="selectTemplate(this, 'rust-clean', 'my_rust_clean_app')">
        <span class="template-badge">Rust</span>
        <div class="template-title">Rust Clean Architecture App</div>
        <div class="template-desc">Layered Rust project with domain, service, lib.rs, and Cargo.toml.</div>
      </div>

      <!-- Python -->
      <div class="template-card" data-cat="python" data-id="py-console" onclick="selectTemplate(this, 'py-console', 'MyPyConsole')">
        <span class="template-badge">Python</span>
        <div class="template-title">Python Console App</div>
        <div class="template-desc">Standard Python command-line project with main.py and requirements.txt.</div>
      </div>

      <div class="template-card" data-cat="python" data-id="py-clean" onclick="selectTemplate(this, 'py-clean', 'MyPyCleanApp')">
        <span class="template-badge">Python</span>
        <div class="template-title">Python Clean Architecture App</div>
        <div class="template-desc">Structured Python project with domain, services, adapters, and pytest.</div>
      </div>

      <div class="template-card" data-cat="python" data-id="py-fastapi" onclick="selectTemplate(this, 'py-fastapi', 'MyFastApi')">
        <span class="template-badge">Python</span>
        <div class="template-title">FastAPI Web API</div>
        <div class="template-desc">Modern, high-performance async Python REST API with Swagger documentation.</div>
      </div>

      <!-- Java -->
      <div class="template-card" data-cat="java" data-id="java-console" onclick="selectTemplate(this, 'java-console', 'MyJavaConsole')">
        <span class="template-badge">Java</span>
        <div class="template-title">Java Console App (Maven)</div>
        <div class="template-desc">Standard Maven-based Java 21 console application.</div>
      </div>

      <div class="template-card" data-cat="java" data-id="java-clean" onclick="selectTemplate(this, 'java-clean', 'MyJavaCleanApp')">
        <span class="template-badge">Java</span>
        <div class="template-title">Java Clean Architecture App</div>
        <div class="template-desc">Layered Java application with domain, application, and infrastructure packages.</div>
      </div>

      <!-- C++ -->
      <div class="template-card" data-cat="cpp" data-id="cpp-console" onclick="selectTemplate(this, 'cpp-console', 'MyCppConsole')">
        <span class="template-badge">C++</span>
        <div class="template-title">C++ Console App (CMake)</div>
        <div class="template-desc">C++17 command-line application configured with CMakeLists.txt.</div>
      </div>

      <!-- Node / TS -->
      <div class="template-card" data-cat="node" data-id="node-console" onclick="selectTemplate(this, 'node-console', 'MyNodeConsole')">
        <span class="template-badge">Node / TypeScript</span>
        <div class="template-title">Node.js Console App (TypeScript)</div>
        <div class="template-desc">TypeScript command-line project with package.json and tsconfig.json.</div>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="config-sidebar">
      <div style="font-size:14px; font-weight:700; border-bottom:1px solid var(--vscode-panel-border); padding-bottom:6px;">
        Project Configuration
      </div>

      <div>
        <label>Selected Template:</label>
        <input type="text" id="selectedTemplateLabel" value="Clean Architecture App" readonly style="opacity:0.85;" />
      </div>

      <div>
        <label>Project / Solution Name:</label>
        <input type="text" id="projName" value="MyCleanApp" />
      </div>

      <div>
        <label>Target Framework:</label>
        <select id="projFramework">
          <option value="net10.0">.NET 10.0 (Visual Studio 2026)</option>
          <option value="net9.0">.NET 9.0</option>
          <option value="net8.0">.NET 8.0 (LTS)</option>
        </select>
      </div>

      <div>
        <label>Location:</label>
        <input type="text" id="destFolder" value="${defaultDir}" />
      </div>

      <button class="btn-create" onclick="createProject()">Create Project</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentTemplateId = 'dotnet-clean-app';

    function selectTemplate(el, id, defaultName) {
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      currentTemplateId = id;
      document.getElementById('selectedTemplateLabel').value = el.querySelector('.template-title').innerText;
      document.getElementById('projName').value = defaultName;
    }

    function filterCat(cat) {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      document.querySelectorAll('.template-card').forEach(c => {
        if (cat === 'all' || c.getAttribute('data-cat') === cat) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }

    function filterSearch() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      document.querySelectorAll('.template-card').forEach(c => {
        const text = c.innerText.toLowerCase();
        if (text.includes(q)) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }

    function createProject() {
      const name = document.getElementById('projName').value;
      const framework = document.getElementById('projFramework').value;
      const destFolder = document.getElementById('destFolder').value;

      vscode.postMessage({
        command: 'createProject',
        templateId: currentTemplateId,
        name,
        framework,
        destFolder
      });
    }
  </script>
</body>
</html>`;
    }
    dispose() {
        StartWindowWebview.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }
}
exports.StartWindowWebview = StartWindowWebview;
//# sourceMappingURL=startWindowWebview.js.map