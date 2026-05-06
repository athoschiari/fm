
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PUBLIC_DIR = path.resolve(__dirname, '../public/parsed_configs');
const VERSIONS_FILE = path.join(PUBLIC_DIR, 'versions.json');
const MANIFEST_FILE = path.join(PUBLIC_DIR, 'config_manifest.json');

async function main() {
    try {
        // 1. Read versions.json
        if (!fs.existsSync(VERSIONS_FILE)) {
            console.error(`Versions file not found at ${VERSIONS_FILE}`);
            process.exit(1);
        }

        const versionsRaw = fs.readFileSync(VERSIONS_FILE, 'utf-8');
        const versions: string[] = JSON.parse(versionsRaw);

        if (!Array.isArray(versions) || versions.length === 0) {
            console.error('Versions file is empty or invalid');
            process.exit(1);
        }

        console.log(`Found ${versions.length} versions to process.`);

        const manifest: Record<string, string[]> = {};

        // 2. Scan directory for each version
        for (const version of versions) {
            const versionDir = path.join(PUBLIC_DIR, version);
            if (!fs.existsSync(versionDir)) {
                console.warn(`Directory for version ${version} not found at ${versionDir}, skipping.`);
                continue;
            }

            const files = fs.readdirSync(versionDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            // Sort files for consistent order
            jsonFiles.sort();

            manifest[version] = jsonFiles;
            console.log(`Version ${version}: ${jsonFiles.length} files`);
        }

        // 3. Generate config_manifest.json
        fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
        console.log(`Manifest generated successfully at ${MANIFEST_FILE}`);

        // 4. Generate TextureManifest.json
        const TEXTURE_DIR = path.resolve(__dirname, '../public/Texture2D');
        const TEXTURE_MANIFEST_FILE = path.join(PUBLIC_DIR, 'TextureManifest.json');

        if (fs.existsSync(TEXTURE_DIR)) {
            const uniqueTextures = new Set<string>();

            // Get all subdirectories (version folders) inside Texture2D
            const versionFolders = fs.readdirSync(TEXTURE_DIR, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            // Iterate through each version folder and collect .png files
            for (const folder of versionFolders) {
                const folderPath = path.join(TEXTURE_DIR, folder);
                const files = fs.readdirSync(folderPath)
                    .filter(file => file.toLowerCase().endsWith('.png'));

                // Add to our Set to ensure no duplicates across versions
                for (const file of files) {
                    uniqueTextures.add(file);
                }
            }

            // Convert the Set back to a sorted array
            const textureFiles = Array.from(uniqueTextures).sort();

            fs.writeFileSync(TEXTURE_MANIFEST_FILE, JSON.stringify(textureFiles, null, 2));
            console.log(`Texture manifest generated: ${textureFiles.length} files at ${TEXTURE_MANIFEST_FILE}`);

        } else {
            console.warn(`Texture directory not found at ${TEXTURE_DIR}`);
        }

        // 5. Generate TextureMD5Manifest.json
        const TEXTURE_MD5_MANIFEST_FILE = path.join(PUBLIC_DIR, 'TextureMD5Manifest.json');
        const md5Manifest: Record<string, Record<string, string>> = {};

        if (fs.existsSync(TEXTURE_DIR)) {
            const versionFolders = fs.readdirSync(TEXTURE_DIR, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const folder of versionFolders) {
                const folderPath = path.join(TEXTURE_DIR, folder);
                const files = fs.readdirSync(folderPath)
                    .filter(file => file.toLowerCase().endsWith('.png'));

                md5Manifest[folder] = {};

                for (const file of files) {
                    const filePath = path.join(folderPath, file);
                    const fileBuffer = fs.readFileSync(filePath);
                    // Calcola l'MD5 del file
                    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
                    md5Manifest[folder][file] = hash;
                }
            }

            fs.writeFileSync(TEXTURE_MD5_MANIFEST_FILE, JSON.stringify(md5Manifest, null, 2));
            console.log(`Texture MD5 manifest generated successfully at ${TEXTURE_MD5_MANIFEST_FILE}`);
        }

    } catch (error) {
        console.error('Error generating manifest:', error);
        process.exit(1);
    }
}

main();
