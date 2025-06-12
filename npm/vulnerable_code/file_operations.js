// file_operations.js
// Demonstrates usage of adm-zip, xml2js, and file system modules.

const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const outputDir = path.join(__dirname, 'output_files');
const tempDir = path.join(__dirname, 'temp_files');

// Ensure output directories exist
mkdirp.sync(outputDir);
mkdirp.sync(tempDir);

console.log('Directories created (if they didnt exist).');

// 1. Create a dummy XML file, then read and parse it
const xmlData = {
    root: {
        item: [
            { name: 'Item 1', value: 'Value 1' },
            { name: 'Item 2', value: 'Value 2' }
        ]
    }
};
const builder = new xml2js.Builder();
const xmlString = builder.buildObject(xmlData);
const xmlFilePath = path.join(tempDir, 'data.xml');
fs.writeFileSync(xmlFilePath, xmlString);
console.log(`Created dummy XML file: ${xmlFilePath}`);

fs.readFile(xmlFilePath, (err, data) => {
    if (err) {
        console.error('Error reading XML file:', err);
        return;
    }
    xml2js.parseString(data, (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return;
        }
        console.log('Parsed XML content:', JSON.stringify(result, null, 2));
    });
});

// 2. Create a zip file with adm-zip
const zip = new AdmZip();
const content = "This is a test file content for zipping.";
fs.writeFileSync(path.join(tempDir, 'file1.txt'), content);
fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'Another file for the zip.');

zip.addLocalFile(path.join(tempDir, 'file1.txt'));
zip.addFile('file2_in_zip.txt', Buffer.from('Content for file2_in_zip.txt', 'utf8'));
zip.addLocalFolder(tempDir, 'temp_folder_in_zip');

const zipFilePath = path.join(outputDir, 'archive.zip');
zip.writeZip(zipFilePath);
console.log(`Created zip file: ${zipFilePath}`);

// 3. Extract a zip file
try {
    const extractZip = new AdmZip(zipFilePath);
    const extractPath = path.join(outputDir, 'extracted_archive');
    mkdirp.sync(extractPath);
    extractZip.extractAllTo(extractPath, /*overwrite*/ true);
    console.log(`Extracted zip file to: ${extractPath}`);
} catch (e) {
    console.error('Error extracting zip:', e);
}

// 4. Clean up temporary directory using rimraf
rimraf(tempDir, (err) => {
    if (err) {
        console.error('Error deleting temp directory:', err);
    } else {
        console.log(`Successfully deleted temp directory: ${tempDir}`);
    }
});

console.log('File operations script finished.');

// To run this file: node vulnerable_code/file_operations.js
