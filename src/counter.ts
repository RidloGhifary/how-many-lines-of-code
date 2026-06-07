import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { IGNORED_FOLDERS, SUPPORTED_EXTENSIONS } from './constants';

export interface LocBreakdown {
  totalLoc: number;
  totalFiles: number;
  locByExtension: Record<string, number>;
}

export async function countLinesInWorkspace(workspaceFolders: string[]): Promise<LocBreakdown> {
  const breakdown: LocBreakdown = {
    totalLoc: 0,
    totalFiles: 0,
    locByExtension: {}
  };

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return breakdown;
  }

  for (const folder of workspaceFolders) {
    await walkAndCount(folder, breakdown);
  }

  return breakdown;
}

async function walkAndCount(dirPath: string, breakdown: LocBreakdown): Promise<void> {
  let entries: fs.Dirent[] = [];
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    // Ignore permissions or non-existent paths
    return;
  }

  const promises: Promise<void>[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_FOLDERS.has(entry.name)) {
        promises.push(walkAndCount(fullPath, breakdown));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        promises.push(countLinesInFile(fullPath, ext, breakdown));
      }
    }
  }

  await Promise.all(promises);
}

async function countLinesInFile(filePath: string, ext: string, breakdown: LocBreakdown): Promise<void> {
  let lines = 0;
  
  try {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim().length > 0) {
        lines++;
      }
    }
  } catch (error) {
    // Ignore read errors
    return;
  }

  if (lines > 0) {
    breakdown.totalLoc += lines;
    breakdown.totalFiles += 1;
    breakdown.locByExtension[ext] = (breakdown.locByExtension[ext] || 0) + lines;
  }
}
