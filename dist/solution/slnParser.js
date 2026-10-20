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
exports.SlnParser = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SlnParser {
    static SOLUTION_FOLDER_GUID = '{2150E333-8FDC-42A3-9474-1A3956D46DE8}';
    static async parse(slnFilePath) {
        const content = await fs.promises.readFile(slnFilePath, 'utf8');
        const directory = path.dirname(slnFilePath);
        const ext = path.extname(slnFilePath);
        const name = path.basename(slnFilePath, ext);
        const projects = [];
        if (ext === '.slnx' || content.includes('<Solution>')) {
            // Modern Visual Studio 2026 .slnx format
            // <Project Path="src/SampleApi/SampleApi.csproj" />
            const projRegex = /<Project\s+[^>]*Path="([^"]+)"[^>]*\/?>/gi;
            let pMatch;
            let idx = 1;
            while ((pMatch = projRegex.exec(content)) !== null) {
                const projRelPath = pMatch[1].trim().replace(/\\/g, '/');
                const projName = path.basename(projRelPath, path.extname(projRelPath));
                const absolutePath = path.resolve(directory, projRelPath);
                projects.push({
                    id: `slnx-proj-${idx++}`,
                    name: projName,
                    relativePath: projRelPath,
                    absolutePath,
                    typeGuid: '{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}',
                    isSolutionFolder: false
                });
            }
        }
        else {
            // Classic Visual Studio .sln format
            // Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ConsoleApp1", "ConsoleApp1\ConsoleApp1.csproj", "{491950A0-E30D-47C0-B773-41E343A4A33B}"
            const projectRegex = /Project\("([^"]+)"\)\s*=\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/g;
            let match;
            while ((match = projectRegex.exec(content)) !== null) {
                const typeGuid = match[1].trim();
                const projName = match[2].trim();
                const projRelPath = match[3].trim().replace(/\\/g, '/');
                const projId = match[4].trim();
                const isSolutionFolder = typeGuid.toUpperCase() === SlnParser.SOLUTION_FOLDER_GUID;
                const absolutePath = path.resolve(directory, projRelPath);
                // Only include .csproj projects or solution folders with valid files
                if (!isSolutionFolder && !projRelPath.endsWith('.csproj')) {
                    continue;
                }
                projects.push({
                    id: projId,
                    name: projName,
                    relativePath: projRelPath,
                    absolutePath,
                    typeGuid,
                    isSolutionFolder
                });
            }
        }
        return {
            name,
            filePath: slnFilePath,
            directory,
            projects
        };
    }
}
exports.SlnParser = SlnParser;
//# sourceMappingURL=slnParser.js.map