interface FileDiff {
  filename: string;
  addedLines: number[];
  deletedLines: number[];
}

function parseGitDiff(diffOutput: string): FileDiff[] {
  const fileDiffs: FileDiff[] = [];
  const lines = diffOutput.split('\n');

  let currentFileDiff: FileDiff | undefined;
  let currentAddedLines: number[] = [];
  let currentDeletedLines: number[] = [];
  let lastHeaderLine: string | undefined;
  let currentLineNumber: number = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      // New file diff starts
      if (currentFileDiff) {
        currentFileDiff.addedLines = currentAddedLines;
        currentFileDiff.deletedLines = currentDeletedLines;
        fileDiffs.push(currentFileDiff);
      }

      currentFileDiff = {
        filename: getFilenameFromDiffHeader(line),
        addedLines: [],
        deletedLines: [],
      };
      currentAddedLines = [];
      currentDeletedLines = [];
      lastHeaderLine = undefined;
      currentLineNumber = 0;
    } else if (line.startsWith('@@')) {
      // Header line
      lastHeaderLine = line;
      const { startingLineNumber, numDeletedLines } = getLineInfoFromHeaderLine(line);
      currentLineNumber = startingLineNumber - 1;
      currentDeletedLines = generateLineNumbers(startingLineNumber - 1, numDeletedLines);
    } else if (line.startsWith('+') && lastHeaderLine && currentLineNumber !== 0) {
      // Added line
      currentAddedLines.push(currentLineNumber + 1);
      currentLineNumber++;
    } else if (line.startsWith('-') && lastHeaderLine && currentLineNumber !== 0) {
      // Deleted line
      currentDeletedLines.push(currentLineNumber + 1);
      currentLineNumber++;
    } else if (!line.startsWith('-')) {
      // Context line
      currentLineNumber++;
    }
  }

  // Add the last file diff
  if (currentFileDiff) {
    currentFileDiff.addedLines = currentAddedLines;
    currentFileDiff.deletedLines = currentDeletedLines;
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

function getLineInfoFromHeaderLine(line: string): { startingLineNumber: number; numDeletedLines: number } {
  // Extract the starting line number and number of deleted lines from the header line
  const matches = line.match(/\-(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
  if (matches && matches.length === 5) {
    const startingLineNumber = parseInt(matches[3], 10);
    const numDeletedLines = matches[4] ? parseInt(matches[4], 10) : 1;
    return { startingLineNumber, numDeletedLines };
  }
  return { startingLineNumber: 0, numDeletedLines: 0 };
}

function generateLineNumbers(startingLineNumber: number, count: number): number[] {
  // Generate an array of line numbers starting from the given startingLineNumber
  const lineNumbers: number[] = [];
  for (let i = startingLineNumber; i < startingLineNumber + count; i++) {
    lineNumbers.push(i);
  }
  return lineNumbers;
}

// Example usage
let diffOutput = `
diff --git a/composer.lock b/composer.lock
index 610566f62..0acf50bdf 100644
--- a/composer.lock
+++ b/composer.lock
@@ -4,7 +4,7 @@
         "Read more about it at https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies",
         "This file is @generated automatically"
     ],
-    "content-hash": "cc9b8800fe910fa2f9937713879fcfc6",
+    "content-hash": "e6f868483400314bb4dbd49daf927f16",
     "packages": [
         {
             "name": "anik/form-request",
`;

let fileDiffs = parseGitDiff(diffOutput);
console.log(fileDiffs);

// Example usage
diffOutput = `
diff --git a/file1.txt b/file1.txt
index abcdefg..1234567 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,4 @@
 This is line 1
-This is line 2
+This is a modified line
 This is line 3
 This is line 4
+This is an added line
diff --git a/file2.txt b/file2.txt
index abcdefg..1234567 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1 +1 @@
-This is line 1
+This is a modified line
`;

fileDiffs = parseGitDiff(diffOutput);
console.log(fileDiffs);
