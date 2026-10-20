# Visual Studio 2026 Mode (VS Code & Antigravity IDE)

Transforms **Visual Studio Code**, **Cursor**, and **Antigravity IDE** 1-to-1 into **Visual Studio 2026** with authentic layout, right-hand Solution Explorer, Start Window, Green Start button, Hot Reload, and first-class project creation & execution for **C# / .NET**, **ASP.NET Core**, **Swift**, **Go**, **Rust**, **Python**, **Java**, **C++**, and **Node.js / TypeScript**.

---

## 🌟 Key Features

* **🟢 Authentic Green Start Button (`▶ Start` / `F5`)**:
  * Positioned at the top right of the editor title bar right beside the run actions.
  * **Auto-Save before launch**: automatically saves all open tabs before running (just like Visual Studio).
  * **Universal Multi-Language Engine**: automatically recognizes active file and runs:
    * **C# / .NET**: locates nearest `.csproj` or `.sln` and invokes `dotnet run`.
    * **Swift**: runs `swift run` (if `Package.swift` exists) or `swift <file.swift>`.
    * **Go**: runs `go run .` (if `go.mod` exists) or `go run <file.go>`.
    * **Rust**: runs `cargo run` (if `Cargo.toml` exists) or `rustc <file.rs>`.
    * **Python**: detects `.venv` / `venv` and executes `python <file.py>`.
    * **Java**: runs `java <file.java>` with automatic fallback to `javac`.
    * **C / C++**: compiles with `clang++` / `g++ -std=c++20` and executes.
    * **TypeScript / Node**: runs with `npx ts-node` or `node`.
* **🏠 Visual Studio 2026 Start Window (`⌂`)**:
  * Create multi-tier **Clean Architecture** solutions and **Console Applications** with 1 click across:
    * **.NET (C#)**: Clean Architecture (Domain, Application, Infrastructure, WebApi), Console App, Class Library, Worker Service.
    * **ASP.NET Core**: Web API, Minimal API, MVC, Blazor Web App.
    * **Swift**: Swift Package Manager Console App, Swift Clean Architecture App.
    * **Go**: Go Console App, Go Clean Architecture (cmd/internal), Go Web API.
    * **Rust**: Rust Cargo Console App, Rust Clean Architecture.
    * **Python**: Console App, Clean Architecture, FastAPI REST API.
    * **Java**: Maven Console App (Java 21), Java Clean Architecture.
    * **C++**: CMake C++17/20 Console App.
    * **Node / TS**: TypeScript Console App with tsconfig.
* **📂 Solution Explorer & Properties on the Right**:
  * Places the Solution Explorer and Properties panels on the right side of the screen, preserving the classic Visual Studio layout.
* **✨ "Add New Item..." Dialog (`Shift+Alt+A` / `Shift+Alt+C`)**:
  * Context-aware item creation for C# classes, records, interfaces, controllers, Go structs, Rust modules, Swift types, and Python scripts with automatic namespace and package resolution.
* **🔥 Hot Reload Integration**:
  * One-click hot reload toggle right next to the Start button.
* **🟣 Visual Studio 2026 Dark Theme**:
  * Authentic Visual Studio purple accents (`#68217A`), dark editor background (`#1E1E1E`), and full status bar tooling.

---

## 💻 Installation Guide (Mac, Windows, Linux)

### 🚀 Option 1: Install Pre-Built `.vsix` Package (Recommended)

#### Method A: Via VS Code GUI (All Platforms)
1. Open **Visual Studio Code** (or Cursor / Antigravity IDE).
2. Open the **Extensions** panel (`Ctrl+Shift+X` on Windows/Linux, `Cmd+Shift+X` on macOS).
3. Click the **`...`** (More Actions) menu at the top-right of the Extensions panel.
4. Select **Install from VSIX...**
5. Choose `vs2026-mode-0.5.0.vsix` and click **Install**.
6. When prompted, reload the window.

#### Method B: Via Terminal / Command Line

* **macOS**:
  ```bash
  code --install-extension vs2026-mode-0.5.0.vsix --force
  ```

* **Windows (PowerShell or Command Prompt)**:
  ```powershell
  code --install-extension vs2026-mode-0.5.0.vsix --force
  ```

* **Linux (Ubuntu, Debian, Fedora, Arch)**:
  ```bash
  code --install-extension vs2026-mode-0.5.0.vsix --force
  ```

> 💡 **For Cursor or VSCodium users**: Replace `code` with `cursor` or `codium` in the commands above.

---

### 🛠️ Option 2: Build & Install from Source

#### Prerequisites
* **Node.js** (v18.0.0 or newer)
* **npm** (v9.0.0 or newer)
* **Git**

#### Steps:
```bash
# 1. Clone your repository
git clone https://github.com/pstalnychenko-lgtm/vs2026-mode.git
cd vs2026-mode

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Package the extension into .vsix
npx @vscode/vsce package --allow-missing-repository

# 5. Install the generated .vsix
code --install-extension vs2026-mode-0.5.0.vsix --force
```

---

## ⚙️ Recommended Language Toolchains

To get the full Visual Studio 2026 experience across all languages, ensure your desired toolchains are installed:

| Language | macOS (Homebrew / Xcode) | Windows (winget / scoop) | Linux (apt / dnf / pacman) |
|---|---|---|---|
| **.NET (C#)** | `brew install dotnet-sdk` | `winget install Microsoft.DotNet.SDK.8` | `sudo apt install dotnet-sdk-8.0` |
| **Go** | `brew install go` | `winget install GoLang.Go` | `sudo apt install golang-go` |
| **Rust** | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | `winget install Rustlang.Rustup` | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Swift** | Bundled with Xcode or `swift.org` | Swift for Windows (`swift.org`) | `sudo apt install swiftlang` |
| **Python** | `brew install python` | `winget install Python.Python.3.12` | `sudo apt install python3 python3-pip` |
| **Java** | `brew install openjdk` | `winget install EclipseAdoptium.Temurin.21.JDK` | `sudo apt install openjdk-21-jdk` |
| **C / C++** | `xcode-select --install` | `winget install LLVM.LLVM` or MSVC | `sudo apt install build-essential clang` |

---

## ⌨️ Keyboard Shortcuts Cheatsheet

| Action | macOS | Windows / Linux |
|---|---|---|
| **Start Debugging / Run (`▶`)** | `F5` | `F5` |
| **Start Without Debugging (`▷`)** | `Cmd + F5` | `Ctrl + F5` |
| **Build Solution / Project** | `Cmd + Shift + B` | `Ctrl + Shift + B` |
| **Toggle Visual Studio 2026 Mode** | `Ctrl + Cmd + V` | `Ctrl + Alt + M` |
| **Add New Item...** | `Shift + Alt + A` | `Shift + Alt + A` |
| **Add Class...** | `Shift + Alt + C` | `Shift + Alt + C` |

---

## 🔒 Privacy & Safety
* **100% Offline & Local**: This extension executes entirely within your local VS Code environment.
* **No Telemetry / No Tracking**: No external analytics or tracking scripts are included.
* **Open & Auditable**: All source code is compiled from plain TypeScript in the `src/` folder.

---

## 📄 License
MIT License. Created for the ultimate Visual Studio experience across all operating systems.
