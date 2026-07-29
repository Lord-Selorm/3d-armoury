import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Octane } from 'three/addons/loaders/Octane.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, 'temp_m4a1');
const outPath = path.join(__dirname, 'm4a1_new.glb');

// Extract zip
import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Extract using python
execSync(`python -c "
import zipfile, os
z = zipfile.ZipFile(r'${tempDir.replace(/\\/g, '\\\\')}.zip')
z.extractall(r'${tempDir.replace(/\\/g, '\\\\')}')
print('Extracted to', r'${tempDir.replace(/\\/g, '\\\\')}')
"`, { stdio: 'inherit' });

const fbxDir = path.join(tempDir, 'M4A1');
const files = fs.readdirSync(fbxDir);
console.log('Files:', files);

// Set up Three.js scene
const scene = new THREE.Scene();

const manager = new THREE.LoadingManager();
const loader = new FBXLoader(manager);

// Convert textures to PNG base64 and embed
function embedTexture(renderer, texture) {
    if (!texture || !texture.image) return texture;
    // Textures should already be loaded by FBXLoader
    return texture;
}

manager.setURLModifier((url) => {
    // Map texture names to local file paths
    const texMap = {
        'M4A1_Base_Color.png': path.join(fbxDir, 'M4A1_Base_Color.png'),
        'M4A1_Height.png': path.join(fbxDir, 'M4A1_Height.png'),
        'M4A1_Metallic.png': path.join(fbxDir, 'M4A1_Metallic.png'),
        'M4A1_Normal.png': path.join(fbxDir, 'M4A1_Normal.png'),
        'M4A1_Roughness.png': path.join(fbxDir, 'M4A1_Roughness.png'),
    };
    const basename = path.basename(url);
    if (texMap[basename]) {
        return 'file://' + texMap[basename].replace(/\\/g, '/');
    }
    return url;
});

// Create a WebGL renderer (offscreen) needed for texture conversion
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

const fbxUrl = 'file://' + path.join(fbxDir, 'M4A1.fbx').replace(/\\/g, '/');
console.log('Loading FBX from:', fbxUrl);

const fbx = await loader.loadAsync(fbxUrl);
scene.add(fbx);

// Center and scale the model
const box = new THREE.Box3().setFromObject(fbx);
const center = box.getCenter(new THREE.Vector3());
const size = box.getSize(new THREE.Vector3());
console.log('Model size:', size.toArray(), 'center:', center.toArray());

// center
fbx.position.sub(center);

// Scale to match existing model proportions (roughly 1m long)
const targetLength = 1.0;
const scale = targetLength / size.z;
fbx.scale.set(scale, scale, scale);
console.log('Applied scale:', scale);

// Export to GLB
const exporter = new GLTFExporter();
const result = await exporter.parseAsync(fbx, {
    binary: true,
    trs: false,
    onlyVisible: true,
    includeCustomExtensions: false,
});

fs.writeFileSync(outPath, Buffer.from(result));
console.log('Written to:', outPath);
console.log('Size:', (await fs.promises.stat(outPath)).size, 'bytes');

renderer.dispose();
process.exit(0);
