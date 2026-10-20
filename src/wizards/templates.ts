export interface ItemTemplate {
  id: string;
  category: 'csharp' | 'python' | 'java' | 'cpp' | 'typescript' | 'swift' | 'go' | 'rust' | 'general';
  label: string;
  description: string;
  detail: string;
  defaultFileName: string;
  icon: string;
  generateContent: (namespaceName: string, itemName: string, fileScoped?: boolean) => string;
}

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // ================= C# / .NET =================
  {
    id: 'cs-class',
    category: 'csharp',
    label: '$(symbol-class) C# Class',
    description: 'An empty class definition (C#)',
    detail: 'public class ClassName { ... }',
    defaultFileName: 'Class1.cs',
    icon: 'symbol-class',
    generateContent: (ns, name, fileScoped = true) => {
      if (fileScoped) {
        return `namespace ${ns};\n\npublic class ${name}\n{\n    \n}\n`;
      }
      return `namespace ${ns}\n{\n    public class ${name}\n    {\n        \n    }\n}\n`;
    }
  },
  {
    id: 'cs-interface',
    category: 'csharp',
    label: '$(symbol-interface) C# Interface',
    description: 'An empty interface declaration (C#)',
    detail: 'public interface IName { ... }',
    defaultFileName: 'IClass1.cs',
    icon: 'symbol-interface',
    generateContent: (ns, name, fileScoped = true) => {
      const ifaceName = name.startsWith('I') && name.length > 1 && name[1] === name[1].toUpperCase()
        ? name
        : `I${name}`;
      if (fileScoped) {
        return `namespace ${ns};\n\npublic interface ${ifaceName}\n{\n    \n}\n`;
      }
      return `namespace ${ns}\n{\n    public interface ${ifaceName}\n    {\n        \n    }\n}\n`;
    }
  },
  {
    id: 'cs-record',
    category: 'csharp',
    label: '$(symbol-struct) C# Record',
    description: 'A C# record declaration with value-based equality',
    detail: 'public record RecordName(...);',
    defaultFileName: 'Record1.cs',
    icon: 'symbol-struct',
    generateContent: (ns, name, fileScoped = true) => {
      if (fileScoped) {
        return `namespace ${ns};\n\npublic record ${name}();\n`;
      }
      return `namespace ${ns}\n{\n    public record ${name}();\n}\n`;
    }
  },
  {
    id: 'cs-enum',
    category: 'csharp',
    label: '$(symbol-enum) C# Enum',
    description: 'A strongly typed C# enumeration',
    detail: 'public enum EnumName { ... }',
    defaultFileName: 'Enum1.cs',
    icon: 'symbol-enum',
    generateContent: (ns, name, fileScoped = true) => {
      if (fileScoped) {
        return `namespace ${ns};\n\npublic enum ${name}\n{\n    None = 0,\n    First = 1\n}\n`;
      }
      return `namespace ${ns}\n{\n    public enum ${name}\n    {\n        None = 0,\n        First = 1\n    }\n}\n`;
    }
  },
  {
    id: 'cs-controller',
    category: 'csharp',
    label: '$(server-process) ASP.NET Core API Controller',
    description: 'ASP.NET Core REST API Controller with route attribute',
    detail: '[ApiController] [Route("api/[controller]")]',
    defaultFileName: 'ApiController1.cs',
    icon: 'server-process',
    generateContent: (ns, name, fileScoped = true) => {
      const ctrlName = name.endsWith('Controller') ? name : `${name}Controller`;
      if (fileScoped) {
        return `using Microsoft.AspNetCore.Mvc;\n\nnamespace ${ns};\n\n[ApiController]\n[Route("api/[controller]")]\npublic class ${ctrlName} : ControllerBase\n{\n    [HttpGet]\n    public IActionResult Get()\n    {\n        return Ok(new { message = "Hello from ${ctrlName}" });\n    }\n}\n`;
      }
      return `using Microsoft.AspNetCore.Mvc;\n\nnamespace ${ns}\n{\n    [ApiController]\n    [Route("api/[controller]")]\n    public class ${ctrlName} : ControllerBase\n    {\n        [HttpGet]\n        public IActionResult Get()\n        {\n            return Ok(new { message = "Hello from ${ctrlName}" });\n        }\n    }\n}\n`;
    }
  },

  // ================= PYTHON =================
  {
    id: 'py-module',
    category: 'python',
    label: '$(symbol-file) Python Module',
    description: 'An empty Python script or module',
    detail: 'Standard Python (.py) file',
    defaultFileName: 'module1.py',
    icon: 'symbol-file',
    generateContent: (_, name) => {
      return `\"\"\"\nModule: ${name}\nCreated in Visual Studio 2026\n\"\"\"\n\ndef main():\n    print("Hello from ${name}")\n\nif __name__ == "__main__":\n    main()\n`;
    }
  },
  {
    id: 'py-class',
    category: 'python',
    label: '$(symbol-class) Python Class',
    description: 'A Python class with constructor and type annotations',
    detail: 'class ClassName: ...',
    defaultFileName: 'my_class.py',
    icon: 'symbol-class',
    generateContent: (_, name) => {
      const className = name.charAt(0).toUpperCase() + name.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      return `class ${className}:\n    \"\"\"Description of ${className}.\"\"\"\n\n    def __init__(self, name: str = "") -> None:\n        self.name = name\n\n    def execute(self) -> None:\n        print(f"Executing {self.name}")\n`;
    }
  },
  {
    id: 'py-package',
    category: 'python',
    label: '$(package) Python Package (__init__.py)',
    description: 'Initializes a Python package folder',
    detail: '__init__.py',
    defaultFileName: '__init__.py',
    icon: 'package',
    generateContent: () => {
      return `\"\"\"\nPackage initialization\n\"\"\"\n__version__ = "0.1.0"\n`;
    }
  },
  {
    id: 'py-test',
    category: 'python',
    label: '$(check) PyTest Unit Test',
    description: 'A pytest test file with sample assertions',
    detail: 'def test_example(): ...',
    defaultFileName: 'test_module.py',
    icon: 'check',
    generateContent: (_, name) => {
      return `import pytest\n\ndef test_${name}_success():\n    \"\"\"Sample passing test.\"\"\"\n    assert 1 + 1 == 2\n\ndef test_${name}_computation():\n    result = [x * 2 for x in range(3)]\n    assert result == [0, 2, 4]\n`;
    }
  },

  // ================= JAVA =================
  {
    id: 'java-class',
    category: 'java',
    label: '$(symbol-class) Java Class',
    description: 'A standard Java class declaration',
    detail: 'public class ClassName { ... }',
    defaultFileName: 'Class1.java',
    icon: 'symbol-class',
    generateContent: (pkg, name) => {
      const pkgDecl = pkg && pkg !== 'App' ? `package ${pkg.toLowerCase()};\n\n` : '';
      return `${pkgDecl}public class ${name} {\n\n    public ${name}() {\n    }\n\n    public static void main(String[] args) {\n        System.out.println("Hello from ${name}");\n    }\n}\n`;
    }
  },
  {
    id: 'java-interface',
    category: 'java',
    label: '$(symbol-interface) Java Interface',
    description: 'An abstract Java interface',
    detail: 'public interface IName { ... }',
    defaultFileName: 'IClass1.java',
    icon: 'symbol-interface',
    generateContent: (pkg, name) => {
      const pkgDecl = pkg && pkg !== 'App' ? `package ${pkg.toLowerCase()};\n\n` : '';
      return `${pkgDecl}public interface ${name} {\n    void execute();\n}\n`;
    }
  },
  {
    id: 'java-enum',
    category: 'java',
    label: '$(symbol-enum) Java Enum',
    description: 'A Java enum declaration',
    detail: 'public enum EnumName { ... }',
    defaultFileName: 'Enum1.java',
    icon: 'symbol-enum',
    generateContent: (pkg, name) => {
      const pkgDecl = pkg && pkg !== 'App' ? `package ${pkg.toLowerCase()};\n\n` : '';
      return `${pkgDecl}public enum ${name} {\n    NONE,\n    ACTIVE,\n    SUSPENDED\n}\n`;
    }
  },

  // ================= C / C++ =================
  {
    id: 'cpp-source',
    category: 'cpp',
    label: '$(file-code) C++ Source File',
    description: 'A C++ source implementation file (.cpp)',
    detail: '#include <iostream>',
    defaultFileName: 'Source1.cpp',
    icon: 'file-code',
    generateContent: (_, name) => {
      return `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${name} (Visual Studio 2026)" << std::endl;\n    return 0;\n}\n`;
    }
  },
  {
    id: 'cpp-header',
    category: 'cpp',
    label: '$(file-code) C++ Header File',
    description: 'A C++ header declaration file (.h)',
    detail: '#pragma once',
    defaultFileName: 'Header1.h',
    icon: 'file-code',
    generateContent: (_, name) => {
      return `#pragma once\n\nclass ${name} {\npublic:\n    ${name}();\n    ~${name}();\n    void Execute();\n};\n`;
    }
  },

  // ================= TYPESCRIPT / JAVASCRIPT =================
  {
    id: 'ts-module',
    category: 'typescript',
    label: '$(file-code) TypeScript File',
    description: 'A TypeScript module (.ts) with types',
    detail: 'export const ...',
    defaultFileName: 'module1.ts',
    icon: 'file-code',
    generateContent: (_, name) => {
      return `export interface ${name}Config {\n  name: string;\n  enabled: boolean;\n}\n\nexport class ${name}Service {\n  constructor(private config: ${name}Config) {}\n\n  public run(): void {\n    console.log(\`Running \${this.config.name}\`);\n  }\n}\n`;
    }
  },
  {
    id: 'ts-react',
    category: 'typescript',
    label: '$(symbol-interface) React Component (TSX)',
    description: 'A React functional component in TypeScript',
    detail: 'export const Component: React.FC = () => ...',
    defaultFileName: 'Component1.tsx',
    icon: 'symbol-interface',
    generateContent: (_, name) => {
      return `import React from 'react';\n\nexport interface ${name}Props {\n  title?: string;\n}\n\nexport const ${name}: React.FC<${name}Props> = ({ title = "${name}" }) => {\n  return (\n    <div className="vs2026-component">\n      <h2>{title}</h2>\n    </div>\n  );\n};\n`;
    }
  },

  // ================= GO =================
  {
    id: 'go-source',
    category: 'go',
    label: '$(file-code) Go Source File',
    description: 'A standard Go source file (.go)',
    detail: 'package main ...',
    defaultFileName: 'main.go',
    icon: 'file-code',
    generateContent: (_, name) => {
      const pkg = name.toLowerCase() === 'main' ? 'main' : name.toLowerCase();
      return `package ${pkg}\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from ${name} (Visual Studio 2026)")\n}\n`;
    }
  },
  {
    id: 'go-struct',
    category: 'go',
    label: '$(symbol-struct) Go Struct & Interface',
    description: 'Go data structure with constructor and interface',
    detail: 'type Item struct { ... }',
    defaultFileName: 'service.go',
    icon: 'symbol-struct',
    generateContent: (_, name) => {
      const typeName = name.charAt(0).toUpperCase() + name.slice(1);
      return `package main\n\ntype ${typeName} struct {\n    ID   string\n    Name string\n}\n\nfunc New${typeName}(id, name string) *${typeName} {\n    return &${typeName}{\n        ID:   id,\n        Name: name,\n    }\n}\n`;
    }
  },

  // ================= RUST =================
  {
    id: 'rust-source',
    category: 'rust',
    label: '$(file-code) Rust Source File',
    description: 'A Rust source module (.rs)',
    detail: 'fn main() { ... }',
    defaultFileName: 'main.rs',
    icon: 'file-code',
    generateContent: (_, name) => {
      return `fn main() {\n    println!("Hello from ${name} (Visual Studio 2026)");\n}\n`;
    }
  },
  {
    id: 'rust-struct',
    category: 'rust',
    label: '$(symbol-struct) Rust Struct & Impl',
    description: 'Rust struct definition with impl block',
    detail: 'pub struct Item { ... }',
    defaultFileName: 'model.rs',
    icon: 'symbol-struct',
    generateContent: (_, name) => {
      const typeName = name.charAt(0).toUpperCase() + name.slice(1);
      return `pub struct ${typeName} {\n    pub id: String,\n    pub name: String,\n}\n\nimpl ${typeName} {\n    pub fn new(id: &str, name: &str) -> Self {\n        Self {\n            id: id.to_string(),\n            name: name.to_string(),\n        }\n    }\n}\n`;
    }
  },

  // ================= SWIFT =================
  {
    id: 'swift-source',
    category: 'swift',
    label: '$(file-code) Swift Source File',
    description: 'A Swift source file (.swift)',
    detail: 'import Foundation',
    defaultFileName: 'main.swift',
    icon: 'file-code',
    generateContent: (_, name) => {
      return `import Foundation\n\nprint("Hello from ${name} (Visual Studio 2026)!")\n`;
    }
  },
  {
    id: 'swift-class',
    category: 'swift',
    label: '$(symbol-class) Swift Class / Struct',
    description: 'A Swift class or struct declaration',
    detail: 'public struct Item: Codable { ... }',
    defaultFileName: 'User.swift',
    icon: 'symbol-class',
    generateContent: (_, name) => {
      const typeName = name.charAt(0).toUpperCase() + name.slice(1);
      return `import Foundation\n\npublic struct ${typeName}: Identifiable, Codable {\n    public let id: UUID\n    public var name: String\n\n    public init(id: UUID = UUID(), name: String) {\n        self.id = id\n        self.name = name\n    }\n}\n`;
    }
  },

  // ================= GENERAL / DATA =================
  {
    id: 'general-json',
    category: 'general',
    label: '$(json) JSON Configuration File',
    description: 'A JSON document',
    detail: '{ ... }',
    defaultFileName: 'config.json',
    icon: 'json',
    generateContent: () => {
      return `{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "version": "1.0.0",\n  "settings": {}\n}\n`;
    }
  },
  {
    id: 'general-sql',
    category: 'general',
    label: '$(database) SQL Query Script',
    description: 'A SQL script file for queries and schemas',
    detail: 'SELECT * FROM ...',
    defaultFileName: 'script1.sql',
    icon: 'database',
    generateContent: (_, name) => {
      return `-- Visual Studio 2026 SQL Script: ${name}\n\nSELECT GETDATE() AS CurrentDateTime;\n`;
    }
  }
];
