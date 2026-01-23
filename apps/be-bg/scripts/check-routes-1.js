#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

// Get folder and file arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('Usage: node check-routes-1.js <folder> <file>');
    console.error('Example: node check-routes-1.js ./src ./routes.txt');
    process.exit(1);
}

const folderPath = args[0];
const filePath = args[1];

const brunoTestedUrls = [];
const swaggerRoutes = [];

// Validate folder exists
if (!fs.existsSync(folderPath)) {
    console.error(`Error: Folder not found: ${folderPath}`);
    process.exit(1);
}

// Validate it's a directory
if (!fs.statSync(folderPath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${folderPath}`);
    process.exit(1);
}

console.log(`Processing folder: ${folderPath}`);
console.log(`Output file: ${filePath}`);

// Your function to implement
function getUrl(content) {
    const httpVerbPattern = /(get|post|put|patch|delete|head|options)\s*\{[^}]*url:\s*([^\n]+)/gi;
    const matches = [...content.matchAll(httpVerbPattern)];
    const results = [];
    
    for (const match of matches) {
        const verb = match[1].toUpperCase();
        const url = match[2].trim();
        
        results.push({
            verb: verb,
            url: url
        });
    }
    
    return results;
}

// Recursive function to traverse folders
function traverseFolder(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            // Recursively process subdirectories
            traverseFolder(fullPath);
        } else if (entry.isFile()) {
            // Process file
            
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const results = getUrl(content);
                
                if (results.length > 0) {
                    for (const result of results) {
                        result.url = result.url.replaceAll('{{URL}}', '');
                        brunoTestedUrls.push(`${result.verb.toUpperCase()} ${result.url}`);
                    }
                }
            } catch (error) {
                console.error(`Error reading file ${fullPath}:`, error.message);
            }
        }
    }
}

function traverseRoutesFile(filePath) {
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0) {  // Skip empty lines
                swaggerRoutes.push(trimmedLine);
            }
        }
        
        console.log(`Loaded ${swaggerRoutes.length} routes from ${filePath}`);
        return swaggerRoutes;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        process.exit(1);
    }
}

// Call it after validation
// Start traversal
traverseFolder(folderPath);
traverseRoutesFile(filePath);

console.log('Done!');
console.log(brunoTestedUrls);
console.log(swaggerRoutes);
