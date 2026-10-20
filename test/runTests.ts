import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { SlnParser } from '../src/solution/slnParser';
import { CsprojParser } from '../src/solution/csprojParser';
import { NamespaceResolver } from '../src/wizards/namespaceResolver';
import { ITEM_TEMPLATES } from '../src/wizards/templates';

async function runAllTests() {
  console.log('=== Running Visual Studio 2026 Extension Tests ===\n');

  // Test 1: SlnParser
  console.log('Test 1: SlnParser...');
  const sampleSln = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "App.Core", "src\\App.Core\\App.Core.csproj", "{491950A0-E30D-47C0-B773-41E343A4A33B}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "App.Api", "src\\App.Api\\App.Api.csproj", "{8F123456-E30D-47C0-B773-41E343A4A33C}"
EndProject
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "Solution Items", "Solution Items", "{D2B3F0A5-5028-44A9-A93D-4B44B9E9B072}"
EndProject
Global
EndGlobal
`;
  const tempSlnPath = path.join(__dirname, 'temp_test.sln');
  await fs.promises.writeFile(tempSlnPath, sampleSln, 'utf8');

  const parsedSln = await SlnParser.parse(tempSlnPath);
  assert.strictEqual(parsedSln.name, 'temp_test');
  assert.strictEqual(parsedSln.projects.length, 3);
  const coreProj = parsedSln.projects.find(p => p.name === 'App.Core');
  assert.ok(coreProj);
  assert.strictEqual(coreProj!.relativePath, 'src/App.Core/App.Core.csproj');
  assert.strictEqual(coreProj!.isSolutionFolder, false);
  const solFolder = parsedSln.projects.find(p => p.name === 'Solution Items');
  assert.ok(solFolder);
  assert.strictEqual(solFolder!.isSolutionFolder, true);
  await fs.promises.unlink(tempSlnPath);
  console.log('✓ SlnParser passed!\n');

  // Test 2: CsprojParser
  console.log('Test 2: CsprojParser...');
  const sampleCsproj = `
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <RootNamespace>MyCompany.Commerce.Api</RootNamespace>
    <OutputType>Exe</OutputType>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.2" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\\Commerce.Core\\Commerce.Core.csproj" />
  </ItemGroup>
</Project>
`;
  const tempCsprojPath = path.join(__dirname, 'temp_test.csproj');
  await fs.promises.writeFile(tempCsprojPath, sampleCsproj, 'utf8');

  const parsedCsproj = await CsprojParser.parse(tempCsprojPath);
  assert.strictEqual(parsedCsproj.name, 'temp_test');
  assert.strictEqual(parsedCsproj.targetFramework, 'net8.0');
  assert.strictEqual(parsedCsproj.rootNamespace, 'MyCompany.Commerce.Api');
  assert.strictEqual(parsedCsproj.outputType, 'Exe');
  assert.strictEqual(parsedCsproj.packages.length, 2);
  assert.strictEqual(parsedCsproj.packages[0].name, 'Newtonsoft.Json');
  assert.strictEqual(parsedCsproj.packages[0].version, '13.0.3');
  assert.strictEqual(parsedCsproj.projectReferences.length, 1);
  assert.strictEqual(parsedCsproj.projectReferences[0].projectName, 'Commerce.Core');
  await fs.promises.unlink(tempCsprojPath);
  console.log('✓ CsprojParser passed!\n');

  // Test 3: Templates
  console.log('Test 3: C# Item Templates...');
  const classTemplate = ITEM_TEMPLATES.find(t => t.id === 'class');
  assert.ok(classTemplate);
  const classContent = classTemplate!.generateContent('MyCompany.Services', 'OrderService', true);
  assert.ok(classContent.includes('namespace MyCompany.Services;'));
  assert.ok(classContent.includes('public class OrderService'));

  const enumTemplate = ITEM_TEMPLATES.find(t => t.id === 'enum');
  assert.ok(enumTemplate);
  const enumContent = enumTemplate!.generateContent('MyCompany.Enums', 'OrderStatus', true);
  assert.ok(enumContent.includes('public enum OrderStatus'));
  assert.ok(enumContent.includes('None = 0'));
  console.log('✓ Item Templates passed!\n');

  console.log('================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (3/3)');
  console.log('================================================');
}

runAllTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
