import * as fs from 'fs';
import * as path from 'path';
import { CsprojParser } from '../solution/csprojParser';

export class NamespaceResolver {
  public static async resolve(targetDirectory: string): Promise<{ namespace: string; projectPath?: string }> {
    let currentDir = path.resolve(targetDirectory);
    let csprojPath: string | undefined;

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
      } catch {
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
    let rootNamespace: string;

    try {
      const model = await CsprojParser.parse(csprojPath);
      rootNamespace = model.rootNamespace;
    } catch {
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

  private static cleanIdentifier(name: string): string {
    // Replace non-alphanumeric with underscore and ensure valid start
    const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(cleaned)) {
      return `_${cleaned}`;
    }
    return cleaned;
  }
}
