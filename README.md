# How Many Lines of Code

A simple VS Code extension that counts how many non-empty lines of source code exist in your currently opened workspace and displays the total in the Status Bar.

## Features

- **Status Bar Display**: Always see your total workspace LOC at a glance (`LOC: 12,345`).
- **Auto-Updating**: Automatically recounts when files are created, deleted, or saved.
- **Detailed Breakdown**: Use the "Show Breakdown" command to see total LOC, file count, and a breakdown by file extension in the Output Channel.
- **Optimized**: Uses fast native Node.js streams to process files efficiently without bloating memory.

## Commands

- `How Many Lines of Code: Refresh Count`: Manually triggers a recount.
- `How Many Lines of Code: Show Breakdown`: Opens the Output Channel to display detailed LOC statistics grouped by file extension.

## What is Counted?

### Supported File Types

The extension counts source code lines in the following file types:
`.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte`, `.html`, `.css`, `.scss`, `.json`, `.md`, `.py`, `.go`, `.java`, `.php`, `.rb`, `.rs`, `.cs`, `.cpp`, `.c`, `.h`, `.hpp`, `.swift`, `.kt`, `.dart`, `.sql`, `.yml`, `.yaml`.

### Ignored Folders

To ensure accuracy and performance, standard output, dependency, and hidden directories are ignored, including:
`node_modules`, `.git`, `dist`, `build`, `out`, `.next`, `coverage`, `vendor`, `.turbo`, `.cache`.
