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

function testRouteCoverage(brunoRoutes, swaggerRoutes) {
    // Convert path parameters in swagger routes to regex patterns
    function routeToPattern(route) { //NOSONAR
        // Split into verb and path
        const [verb, path] = route.split(' ');
        
        // Replace path parameters like {id} with a regex pattern
        // Also handle query parameters by removing them for matching
        const pathWithoutQuery = path.split('?')[0];
        const pattern = pathWithoutQuery.replace(/\{[^}]+\}/g, '[^/?]+'); //NOSONAR
        
        return {
            verb,
            pattern: new RegExp(`^${pattern}(\\?.*)?$`), //NOSONAR
            original: route
        };
    }
    
    // Convert all swagger routes to patterns
    const swaggerPatterns = swaggerRoutes.map(routeToPattern);
    
    const results = {
        covered: [],
        missing: [],
        extra: []
    };
    
    // Check which swagger routes are covered by bruno routes
    for (const swaggerPattern of swaggerPatterns) {
        const [verb, path] = swaggerPattern.original.split(' ');
        const pathWithoutQuery = path.split('?')[0]; //NOSONAR
        
        const found = brunoRoutes.some(brunoRoute => {
            const [brunoVerb, brunoPath] = brunoRoute.split(' ');
            const brunoPathWithoutQuery = brunoPath.split('?')[0];
            
            // Check if verb matches and path matches the pattern
            return brunoVerb === verb && swaggerPattern.pattern.test(brunoPathWithoutQuery);
        });
        
        if (found) {
            results.covered.push(swaggerPattern.original);
        } else {
            results.missing.push(swaggerPattern.original);
        }
    }
    
    // Check for extra routes in bruno that aren't in swagger
    for (const brunoRoute of brunoRoutes) {
        const [brunoVerb, brunoPath] = brunoRoute.split(' ');
        const brunoPathWithoutQuery = brunoPath.split('?')[0];
        
        const found = swaggerPatterns.some(pattern => {
            return brunoVerb === pattern.verb && pattern.pattern.test(brunoPathWithoutQuery);
        });
        
        if (!found) {
            results.extra.push(brunoRoute);
        }
    }
    
    return results;
}

// Start traversal
traverseFolder(folderPath);
traverseRoutesFile(filePath);

// Capture the results from testRouteCoverage
const results = testRouteCoverage(brunoTestedUrls, swaggerRoutes);

console.log('\n✅ Covered routes:');
results.covered.forEach(route => console.log(`  ${route}`));

console.log('\n❌ Missing routes (in Swagger but not in Bruno):');
results.missing.forEach(route => console.log(`  ${route}`));

console.log('\n⚠️  Extra routes (in Bruno but not in Swagger):');
results.extra.forEach(route => console.log(`  ${route}`));

console.log(`\nCoverage: ${results.covered.length}/${swaggerRoutes.length} routes covered`);

if (results.covered.length !== swaggerRoutes.length) {
    console.error('\n❌ ERROR: Route coverage is not 100%!');
    console.error(`Missing ${results.missing.length} route(s) in Bruno tests.`);
    process.exit(1);
}
