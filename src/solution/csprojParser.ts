import * as fs from 'fs';
import * as path from 'path';

export interface PackageReference {
  name: string;
  version: string;
}

export interface ProjectReference {
  includePath: string;
  projectName: string;
}

export interface CsprojModel {
  name: string;
  filePath: string;
  directory: string;
  targetFramework: string;
  rootNamespace: string;
  outputType: string;
  packages: PackageReference[];
  projectReferences: ProjectReference[];
}

export class CsprojParser {
  public static async parse(csprojFilePath: string): Promise<CsprojModel> {
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
    const packages: PackageReference[] = [];
    const pkgAttrRegex = /<PackageReference\s+[^>]*Include="([^"]+)"[^>]*Version="([^"]+)"[^>]*\/?>/gi;
    let pkgMatch: RegExpExecArray | null;
    while ((pkgMatch = pkgAttrRegex.exec(content)) !== null) {
      packages.push({
        name: pkgMatch[1],
        version: pkgMatch[2]
      });
    }

    // Handle nested version tag if any
    const pkgNestedRegex = /<PackageReference\s+[^>]*Include="([^"]+)"[^>]*>([\s\S]*?)<\/PackageReference>/gi;
    let nestedMatch: RegExpExecArray | null;
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
    const projectReferences: ProjectReference[] = [];
    const prRegex = /<ProjectReference\s+[^>]*Include="([^"]+)"[^>]*\/?>/gi;
    let prMatch: RegExpExecArray | null;
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
