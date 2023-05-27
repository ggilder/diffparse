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
  let currentLineNumber: number | undefined = undefined;
  let numDeletedLines: number | undefined = undefined;

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
      currentLineNumber = undefined;
      numDeletedLines = undefined;
    } else if (line.startsWith('@@')) {
      // Header line
      lastHeaderLine = line;
      const lineInfo = getLineInfoFromHeaderLine(line);
      currentLineNumber = lineInfo.startingLineNumber;
      numDeletedLines = lineInfo.numDeletedLines;
    } else if (line.startsWith('+') && lastHeaderLine && currentLineNumber !== undefined) {
      // Added line
      currentAddedLines.push(currentLineNumber);
      currentLineNumber++;
    } else if (line.startsWith('-') && lastHeaderLine && currentLineNumber !== undefined && numDeletedLines !== undefined) {
      // Deleted line
      currentDeletedLines.push(currentLineNumber + 1);
      currentLineNumber++;
      numDeletedLines--;
    } else if (currentLineNumber !== undefined && numDeletedLines !== undefined) {
      // Context line
      currentLineNumber++;
      numDeletedLines--;
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
    const startingLineNumber = parseInt(matches[3], 10) - 1;
    const numDeletedLines = matches[4] ? parseInt(matches[4], 10) : 0;
    return { startingLineNumber, numDeletedLines };
  }
  return { startingLineNumber: 0, numDeletedLines: 0 };
}

////////////////////////////////////////////////////////

// Example 1
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

// Example 2
diffOutput = `
diff --git a/file1.txt b/file1.txt
index abcdefg..1234567 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,4 +1,5 @@
 This is line one
-This is line two
+This is a modified line
 This is line three
 This is line four
+This is an added line
@@ -10,3 +10,5 @@
 This is line one
+This is an added line
 This is line two
 This is line four
+This is an added line
diff --git a/file2.txt b/file2.txt
index abcdefg..1234567 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1 +1 @@
-This is a line
+This is a modified line
`;

fileDiffs = parseGitDiff(diffOutput);
console.log(fileDiffs);
