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
exports.NamespaceResolver = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csprojParser_1 = require("../solution/csprojParser");
class NamespaceResolver {
    static async resolve(targetDirectory) {
        let currentDir = path.resolve(targetDirectory);
        let csprojPath;
        // If targetDirectory doesn't exist yet, walk up to first existing ancestor
        while (!fs.existsSync(currentDir)) {
            const parent = path.dirname(currentDir);
            if (parent === currentDir) {
                break;
            }
            currentDir = parent;
        }
        // Search upwards for .csproj
        let searchDir = currentDir;
        while (true) {
            try {
                const files = await fs.promises.readdir(searchDir);
                const csproj = files.find(f => f.endsWith('.csproj'));
                if (csproj) {
                    csprojPath = path.join(searchDir, csproj);
                    break;
                }
            }
            catch {
                break;
            }
            const parent = path.dirname(searchDir);
            if (parent === searchDir) {
                break; // Root reached
            }
            searchDir = parent;
        }
        if (!csprojPath) {
            const defaultName = path.basename(targetDirectory) || 'App';
            return { namespace: this.cleanIdentifier(defaultName) };
        }
        const projectDir = path.dirname(csprojPath);
        let rootNamespace;
        try {
            const model = await csprojParser_1.CsprojParser.parse(csprojPath);
            rootNamespace = model.rootNamespace;
        }
        catch {
            rootNamespace = path.basename(csprojPath, '.csproj');
        }
        const relPath = path.relative(projectDir, targetDirectory);
        if (!relPath || relPath === '.') {
            return { namespace: this.cleanIdentifier(rootNamespace), projectPath: csprojPath };
        }
        const segments = relPath
            .split(/[\\/]/)
            .filter(s => s.length > 0 && s !== '.')
            .map(s => this.cleanIdentifier(s));
        const fullNamespace = [this.cleanIdentifier(rootNamespace), ...segments].join('.');
        return { namespace: fullNamespace, projectPath: csprojPath };
    }
    static cleanIdentifier(name) {
        // Replace non-alphanumeric with underscore and ensure valid start
        const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
        if (/^[0-9]/.test(cleaned)) {
            return `_${cleaned}`;
        }
        return cleaned;
    }
}
exports.NamespaceResolver = NamespaceResolver;
//# sourceMappingURL=namespaceResolver.js.map