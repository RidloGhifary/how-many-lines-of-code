import * as vscode from 'vscode';
import { countLinesInWorkspace, LocBreakdown } from './counter';

let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
let isCounting = false;
let currentBreakdown: LocBreakdown | null = null;

export function activate(context: vscode.ExtensionContext) {
  // Setup Output Channel
  outputChannel = vscode.window.createOutputChannel('How Many Lines of Code');
  context.subscriptions.push(outputChannel);

  // Setup Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'how-many-lines-of-code.showBreakdown';
  context.subscriptions.push(statusBarItem);

  // Register Commands
  const refreshCommand = vscode.commands.registerCommand('how-many-lines-of-code.refresh', async () => {
    vscode.window.showInformationMessage('Refreshing LOC count...');
    await updateCount();
  });

  const showBreakdownCommand = vscode.commands.registerCommand('how-many-lines-of-code.showBreakdown', () => {
    if (!currentBreakdown) {
      vscode.window.showInformationMessage('No count data available. Try refreshing.');
      return;
    }
    showBreakdown(currentBreakdown);
  });

  context.subscriptions.push(refreshCommand, showBreakdownCommand);

  // Setup File Watchers
  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  
  // Debounce to avoid recounting multiple times on rapid saves
  let recountTimeout: NodeJS.Timeout | undefined;
  const scheduleRecount = () => {
    if (recountTimeout) {
      clearTimeout(recountTimeout);
    }
    recountTimeout = setTimeout(() => {
      updateCount();
    }, 1000);
  };

  watcher.onDidCreate(scheduleRecount);
  watcher.onDidDelete(scheduleRecount);
  
  vscode.workspace.onDidSaveTextDocument(scheduleRecount);
  vscode.workspace.onDidChangeWorkspaceFolders(scheduleRecount);

  context.subscriptions.push(watcher);

  // Initial Count
  updateCount();
}

async function updateCount() {
  if (isCounting) return;

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    statusBarItem.hide();
    currentBreakdown = null;
    return;
  }

  isCounting = true;
  statusBarItem.text = '$(sync~spin) LOC: Counting...';
  statusBarItem.show();

  try {
    const paths = workspaceFolders.map(folder => folder.uri.fsPath);
    currentBreakdown = await countLinesInWorkspace(paths);
    
    const formattedLoc = currentBreakdown.totalLoc.toLocaleString();
    statusBarItem.text = `LOC: ${formattedLoc}`;
    statusBarItem.tooltip = `Total Files: ${currentBreakdown.totalFiles.toLocaleString()}\nClick to show breakdown`;
  } catch (error) {
    console.error('Error counting LOC:', error);
    statusBarItem.text = 'LOC: Error';
  } finally {
    isCounting = false;
  }
}

function showBreakdown(breakdown: LocBreakdown) {
  outputChannel.clear();
  outputChannel.appendLine('========================================');
  outputChannel.appendLine('       HOW MANY LINES OF CODE');
  outputChannel.appendLine('========================================');
  outputChannel.appendLine(`Total Non-Empty Lines: ${breakdown.totalLoc.toLocaleString()}`);
  outputChannel.appendLine(`Total Source Files:    ${breakdown.totalFiles.toLocaleString()}`);
  outputChannel.appendLine('----------------------------------------');
  outputChannel.appendLine('Breakdown by Extension:');
  
  const sortedExtensions = Object.entries(breakdown.locByExtension)
    .sort((a, b) => b[1] - a[1]);

  for (const [ext, count] of sortedExtensions) {
    // Pad extension for tabular alignment (e.g., '.ts    : 1,234')
    const paddedExt = ext.padEnd(8, ' ');
    outputChannel.appendLine(`  ${paddedExt} : ${count.toLocaleString()}`);
  }
  
  outputChannel.appendLine('========================================');
  outputChannel.show(true);
}

export function deactivate() {}
