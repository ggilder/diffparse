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
  let seenHeaderLine: boolean = false;
  let currentLineNumberA: number = 0;
  let currentLineNumberB: number = 0;

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
      seenHeaderLine = false;
    } else if (line.startsWith('@@')) {
      // Header line
      seenHeaderLine = true;
      const lineInfo = getLineInfoFromHeaderLine(line);
      currentLineNumberA = lineInfo.deletionStartingLineNumber;
      currentLineNumberB = lineInfo.additionStartingLineNumber;
    } else if (line.startsWith('+') && seenHeaderLine) {
      // Added line
      currentAddedLines.push(currentLineNumberB);
      currentLineNumberB++;
    } else if (line.startsWith('-') && seenHeaderLine) {
      // Deleted line
      currentDeletedLines.push(currentLineNumberA);
      currentLineNumberA++;
    } else if (seenHeaderLine) {
      // Context line
      currentLineNumberA++;
      currentLineNumberB++;
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
  const endIndex = header.indexOf(' b/', startIndex);
  const filename = header.substring(startIndex, endIndex);
  return filename;
}

function getLineInfoFromHeaderLine(line: string): { deletionStartingLineNumber: number; additionStartingLineNumber: number } {
  // Extract the starting line numbers for each side of the diff
  const matches = line.match(/\-(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
  if (matches && matches.length === 5) {
    const deletionStartingLineNumber = parseInt(matches[1], 10);
    const additionStartingLineNumber = parseInt(matches[3], 10);
    return { deletionStartingLineNumber, additionStartingLineNumber };
  }
  return { deletionStartingLineNumber: 0, additionStartingLineNumber: 0 };
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
