interface FileDiff {
  filename: string;
  addedLines: number[];
}

function parseGitDiff(diffOutput: string): FileDiff[] {
  const fileDiffs: FileDiff[] = [];
  const lines = diffOutput.split('\n');

  let currentFileDiff: FileDiff | undefined;
  let currentAddedLines: number[] = [];
  let lastHeaderLine: string | undefined;
  let currentLineNumber: number = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      // New file diff starts
      if (currentFileDiff) {
        currentFileDiff.addedLines = currentAddedLines;
        fileDiffs.push(currentFileDiff);
      }

      currentFileDiff = {
        filename: getFilenameFromDiffHeader(line),
        addedLines: [],
      };
      currentAddedLines = [];
      lastHeaderLine = undefined;
      currentLineNumber = 0;
    } else if (line.startsWith('@@')) {
      // Header line
      lastHeaderLine = line;
      const lineNumber = getStartingLineNumberFromHeaderLine(line);
      currentLineNumber = lineNumber;
    } else if (line.startsWith('+') && lastHeaderLine && currentLineNumber !== 0) {
      // Added line
      currentAddedLines.push(currentLineNumber);
      currentLineNumber++;
    } else if (!line.startsWith('-')) {
      // Context line
      currentLineNumber++;
    }
  }

  // Add the last file diff
  if (currentFileDiff) {
    currentFileDiff.addedLines = currentAddedLines;
    fileDiffs.push(currentFileDiff);
  }

  return fileDiffs;
}

function getFilenameFromDiffHeader(header: string): string {
  // Extract the filename from the diff header
  const startIndex = header.indexOf(' a/') + 3;
  const endIndex = header.indexOf(' ', startIndex);
  const filename = header.substring(startIndex, endIndex);
  return filename;
}

function getStartingLineNumberFromHeaderLine(line: string): number {
  // Extract the starting line number from the header line
  const matches = line.match(/\+(\d+)/);
  if (matches && matches.length > 1) {
    return parseInt(matches[1], 10);
  }
  return 0;
}

// Example usage
const diffOutput = `
diff --git a/file1.txt b/file1.txt
index abcdefg..1234567 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,4 @@
 This is line 1
 This is line 2
+This is an added line
 This is line 3
 This is line 4
`;

const fileDiffs = parseGitDiff(diffOutput);
console.log(fileDiffs);

