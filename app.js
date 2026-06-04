import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

//1. SETUP PIPELINE (Scene, Camera, Renderer)
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 20);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//2. ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02; 
controls.minDistance = 5;
controls.maxDistance = 40;

//3. LIGHTING & SHADOW
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5b6, 1.5);
sunLight.position.set(10, 15, -10);
sunLight.castShadow = true;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

//4. GEOMETRI & LANSKAP ALAM
const objects = [];

const textureLoader = new THREE.TextureLoader();
const crateTexture = textureLoader.load('https://threejs.org/examples/textures/crate.gif');

// A. Laut (PlaneGeometry)
const seaGeo = new THREE.PlaneGeometry(100, 100);
const seaMat = new THREE.MeshStandardMaterial({ 
    color: 0x006994, 
    roughness: 0.1,
    metalness: 0.5   
});
const sea = new THREE.Mesh(seaGeo, seaMat);
sea.rotation.x = -Math.PI / 2;
sea.receiveShadow = true;
scene.add(sea);

// B. Pulau Pasir (Cylinder pipih sebagai base daratan)
const islandGeo = new THREE.CylinderGeometry(8, 8, 0.5, 32);
const islandMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 1.0, metalness: 0.0 });
const island = new THREE.Mesh(islandGeo, islandMat);
island.position.y = 0;
island.receiveShadow = true;
scene.add(island);


//5 OBJEK INTERAKTIF UNTUK RAYCASTING

// A. Gunung Hijau (ConeGeometry)
const mountainGeo = new THREE.ConeGeometry(3, 6, 16);
const mountainMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.9, metalness: 0.1 });
const mountain = new THREE.Mesh(mountainGeo, mountainMat);
mountain.position.set(-3, 3, -2);
mountain.userData = { name: 'Gunung Tropis [CONE]', baseColor: 0x228B22 };
scene.add(mountain);

// B. Matahari (SphereGeometry)
const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
const sunMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5 });
const sunSphere = new THREE.Mesh(sunGeo, sunMat);
sunSphere.position.copy(sunLight.position); 
sunSphere.userData = { name: 'Matahari Terang [SPHERE]', baseColor: 0xffd700 };
scene.add(sunSphere);

// C. Menara Mercusuar (CylinderGeometry)
const lighthouseGeo = new THREE.CylinderGeometry(0.6, 1.2, 5, 16);
const lighthouseMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6, metalness: 0.1 });
const lighthouse = new THREE.Mesh(lighthouseGeo, lighthouseMat);
lighthouse.position.set(4, 2.75, 2);
lighthouse.userData = { name: 'Mercusuar Pengintai [CYLINDER]', baseColor: 0xeeeeee };
scene.add(lighthouse);

// D. Peti Kayu Terdampar (BoxGeometry dengan Texture)
const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
const crateMat = new THREE.MeshStandardMaterial({ map: crateTexture, roughness: 0.8, metalness: 0.1 });
const crate = new THREE.Mesh(crateGeo, crateMat);
crate.position.set(1.5, 0.85, 5);
crate.rotation.y = Math.PI / 4; 
crate.userData = { name: 'Peti Perbekalan [BOX]', baseColor: 0x8b4513 };
scene.add(crate);

// E. Pelampung (TorusGeometry)
const buoyGeo = new THREE.TorusGeometry(0.5, 0.15, 16, 32);
const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.5, metalness: 0.2 });
const buoy = new THREE.Mesh(buoyGeo, buoyMat);
buoy.position.set(5.5, 0.15, 5.5);
buoy.rotation.x = Math.PI / 2;
buoy.userData = { name: 'Pelampung Darurat [TORUS]', baseColor: 0xff4500 };
scene.add(buoy);

const interactiveObjects = [mountain, sunSphere, lighthouse, crate, buoy];
interactiveObjects.forEach(obj => {
    if(obj !== sunSphere) obj.castShadow = true; 
    obj.receiveShadow = true;
    obj.userData.baseScale = obj.scale.clone(); 
    objects.push(obj);
});


//5. RAYCASTING INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;
let hoveredObject = null;
const uiInfo = document.getElementById('info-text');

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    document.body.style.cursor = 'default';
    if (hoveredObject && hoveredObject !== selectedObject) {
        hoveredObject.material.emissive.setHex(0x000000);
        if(hoveredObject === sunSphere) hoveredObject.material.emissive.setHex(0xffaa00);
        hoveredObject.scale.copy(hoveredObject.userData.baseScale);
    }
    hoveredObject = null;

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        hoveredObject = intersects[0].object;

        if (hoveredObject !== selectedObject) {
            hoveredObject.material.emissive.setHex(0x333333);
            if(hoveredObject === sunSphere) hoveredObject.material.emissive.setHex(0xffdd00); 
            hoveredObject.scale.setScalar(1.05); 
        }
    }
});

window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (selectedObject) {
        selectedObject.material.emissive.setHex(0x000000);
        if(selectedObject === sunSphere) selectedObject.material.emissive.setHex(0xffaa00);
        selectedObject.scale.copy(selectedObject.userData.baseScale);
        selectedObject = null;
        uiInfo.style.display = 'none';
    }

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        
        selectedObject.material.emissive.setHex(selectedObject.userData.baseColor);
        selectedObject.material.emissiveIntensity = 0.6;
        selectedObject.scale.setScalar(1.2); 
        
        uiInfo.innerText = `> INSPEKSI: ${selectedObject.userData.name}`;
        uiInfo.style.display = 'block';
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//6. ANIMATION LOOP
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
    const time = clock.getElapsedTime();
    controls.update();

    sunSphere.rotation.y += 0.005;
    
    buoy.position.y = 0.15 + Math.sin(time * 2) * 0.1;
    
    if (selectedObject && selectedObject !== mountain) {
        selectedObject.rotation.y += 0.02; 
    }

    renderer.render(scene, camera);
});