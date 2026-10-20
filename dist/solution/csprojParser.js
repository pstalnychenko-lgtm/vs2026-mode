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
exports.CsprojParser = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CsprojParser {
    static async parse(csprojFilePath) {
        const content = await fs.promises.readFile(csprojFilePath, 'utf8');
        const directory = path.dirname(csprojFilePath);
        const name = path.basename(csprojFilePath, '.csproj');
        // Extract TargetFramework
        let targetFramework = 'net8.0';
        const tfMatch = content.match(/<TargetFramework>(.*?)<\/TargetFramework>/i) ||
            content.match(/<TargetFrameworks>(.*?)<\/TargetFrameworks>/i);
        if (tfMatch && tfMatch[1]) {
            targetFramework = tfMatch[1].trim();
        }
        // Extract RootNamespace
        let rootNamespace = name;
        const rnMatch = content.match(/<RootNamespace>(.*?)<\/RootNamespace>/i);
        if (rnMatch && rnMatch[1]) {
            rootNamespace = rnMatch[1].trim();
        }
        // Extract OutputType (default: Library if not specified)
        let outputType = 'Library';
        const otMatch = content.match(/<OutputType>(.*?)<\/OutputType>/i);
        if (otMatch && otMatch[1]) {
            outputType = otMatch[1].trim();
        }
        // Extract PackageReference
        // <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
        // or <PackageReference Include="Microsoft.AspNetCore.OpenApi"><Version>8.0.0</Version></PackageReference>
        const packages = [];
        const pkgAttrRegex = /<PackageReference\s+[^>]*Include="([^"]+)"[^>]*Version="([^"]+)"[^>]*\/?>/gi;
        let pkgMatch;
        while ((pkgMatch = pkgAttrRegex.exec(content)) !== null) {
            packages.push({
                name: pkgMatch[1],
                version: pkgMatch[2]
            });
        }
        // Handle nested version tag if any
        const pkgNestedRegex = /<PackageReference\s+[^>]*Include="([^"]+)"[^>]*>([\s\S]*?)<\/PackageReference>/gi;
        let nestedMatch;
        while ((nestedMatch = pkgNestedRegex.exec(content)) !== null) {
            const pkgName = nestedMatch[1];
            if (packages.some(p => p.name.toLowerCase() === pkgName.toLowerCase())) {
                continue;
            }
            const vMatch = nestedMatch[2].match(/<Version>(.*?)<\/Version>/i);
            packages.push({
                name: pkgName,
                version: vMatch ? vMatch[1].trim() : 'Implicit'
            });
        }
        // Extract ProjectReference
        // <ProjectReference Include="..\Other\Other.csproj" />
        const projectReferences = [];
        const prRegex = /<ProjectReference\s+[^>]*Include="([^"]+)"[^>]*\/?>/gi;
        let prMatch;
        while ((prMatch = prRegex.exec(content)) !== null) {
            const includePath = prMatch[1].replace(/\\/g, '/');
            const prName = path.basename(includePath, '.csproj');
            projectReferences.push({
                includePath,
                projectName: prName
            });
        }
        return {
            name,
            filePath: csprojFilePath,
            directory,
            targetFramework,
            rootNamespace,
            outputType,
            packages,
            projectReferences
        };
    }
}
exports.CsprojParser = CsprojParser;
//# sourceMappingURL=csprojParser.js.map