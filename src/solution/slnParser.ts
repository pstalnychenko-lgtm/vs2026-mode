import * as fs from 'fs';
import * as path from 'path';

export interface SlnProject {
  id: string;
  name: string;
  relativePath: string;
  absolutePath: string;
  typeGuid: string;
  isSolutionFolder: boolean;
}

export interface SolutionModel {
  name: string;
  filePath: string;
  directory: string;
  projects: SlnProject[];
}

export class SlnParser {
  private static readonly SOLUTION_FOLDER_GUID = '{2150E333-8FDC-42A3-9474-1A3956D46DE8}';

  public static async parse(slnFilePath: string): Promise<SolutionModel> {
    const content = await fs.promises.readFile(slnFilePath, 'utf8');
    const directory = path.dirname(slnFilePath);
    const ext = path.extname(slnFilePath);
    const name = path.basename(slnFilePath, ext);

    const projects: SlnProject[] = [];

    if (ext === '.slnx' || content.includes('<Solution>')) {
      // Modern Visual Studio 2026 .slnx format
      // <Project Path="src/SampleApi/SampleApi.csproj" />
      const projRegex = /<Project\s+[^>]*Path="([^"]+)"[^>]*\/?>/gi;
      let pMatch: RegExpExecArray | null;
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
    } else {
      // Classic Visual Studio .sln format
      // Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "ConsoleApp1", "ConsoleApp1\ConsoleApp1.csproj", "{491950A0-E30D-47C0-B773-41E343A4A33B}"
      const projectRegex = /Project\("([^"]+)"\)\s*=\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/g;
      let match: RegExpExecArray | null;

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
