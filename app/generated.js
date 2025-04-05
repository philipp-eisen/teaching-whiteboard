Response: <!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Three.js Box Scene</title>
<style>
    body {
        margin: 0;
        overflow: hidden;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
</head>

<body>
<script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.162.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.162.0/examples/jsm/"
        }
    }
</script>
<script type="module">
    ```js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Position camera
camera.position.set(0, 5, 15);
controls.update();

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Create a ground plane
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ 
color: 0xcccccc,
roughness: 0.8,
metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
ground.receiveShadow = true;
scene.add(ground);

// Create title text
const createText = () => {
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 512;
canvas.height = 128;
context.fillStyle = '#ffffff';
context.fillRect(0, 0, canvas.width, canvas.height);
context.font = 'bold 48px Arial';
context.fillStyle = '#000000';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.fillText('Working of an Electric Motor', canvas.width / 2, canvas.height / 2);

const texture = new THREE.CanvasTexture(canvas);
const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const geometry = new THREE.PlaneGeometry(10, 2.5);
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 6, 0);
scene.add(mesh);
};

createText();

// Create magnets
const createMagnet = (position, polarity) => {
const magnetGroup = new THREE.Group();

// Magnet body
const magnetGeometry = new THREE.BoxGeometry(1.5, 5, 1.5);
const magnetMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 0.5,
    metalness: 0.7
});
const magnet = new THREE.Mesh(magnetGeometry, magnetMaterial);
magnet.castShadow = true;
magnetGroup.add(magnet);

// Polarity label
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 128;
canvas.height = 128;
context.fillStyle = '#ffffff';
context.fillRect(0, 0, canvas.width, canvas.height);
context.font = 'bold 80px Arial';
context.fillStyle = '#000000';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.fillText(polarity, canvas.width / 2, canvas.height / 2);

const texture = new THREE.CanvasTexture(canvas);
const labelMaterial = new THREE.MeshBasicMaterial({ map: texture });
const labelGeometry = new THREE.PlaneGeometry(1, 1);
const label = new THREE.Mesh(labelGeometry, labelMaterial);
label.position.z = 0.76;
magnetGroup.add(label);

// Color the ends based on polarity
const poleGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
const northMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const southMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });

const topPole = new THREE.Mesh(
    poleGeometry, 
    polarity === 'N' ? northMaterial : southMaterial
);
topPole.position.y = 2.25;
topPole.castShadow = true;
magnetGroup.add(topPole);

const bottomPole = new THREE.Mesh(
    poleGeometry, 
    polarity === 'N' ? southMaterial : northMaterial
);
bottomPole.position.y = -2.25;
bottomPole.castShadow = true;
magnetGroup.add(bottomPole);

magnetGroup.position.copy(position);
scene.add(magnetGroup);

return magnetGroup;
};

const northMagnet = createMagnet(new THREE.Vector3(-6, 0, 0), 'N');
const southMagnet = createMagnet(new THREE.Vector3(6, 0, 0), 'S');

// Create coil
const createCoil = () => {
const coilGroup = new THREE.Group();

// Create the rectangular coil
const coilMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcd7f32, // Bronze/copper color
    roughness: 0.3,
    metalness: 0.8
});

// Top wire
const topWireGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 16);
const topWire = new THREE.Mesh(topWireGeometry, coilMaterial);
topWire.rotation.z = Math.PI / 2;
topWire.position.y = 2;
topWire.castShadow = true;
coilGroup.add(topWire);

// Bottom wire
const bottomWireGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 16);
const bottomWire = new THREE.Mesh(bottomWireGeometry, coilMaterial);
bottomWire.rotation.z = Math.PI / 2;
bottomWire.position.y = -2;
bottomWire.castShadow = true;
coilGroup.add(bottomWire);

// Left wire
const leftWireGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 16);
const leftWire = new THREE.Mesh(leftWireGeometry, coilMaterial);
leftWire.position.x = -3;
leftWire.castShadow = true;
coilGroup.add(leftWire);

// Right wire
const rightWireGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 16);
const rightWire = new THREE.Mesh(rightWireGeometry, coilMaterial);
rightWire.position.x = 3;
rightWire.castShadow = true;
coilGroup.add(rightWire);

// Axle
const axleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 16);
const axleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 0.2,
    metalness: 0.9
});
const axle = new THREE.Mesh(axleGeometry, axleMaterial);
axle.rotation.x = Math.PI / 2;
axle.castShadow = true;
coilGroup.add(axle);

// Create arrow to show rotation direction
const arrowGroup = new THREE.Group();

// Arrow body
const arrowBodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 12);
const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const arrowBody = new THREE.Mesh(arrowBodyGeometry, arrowMaterial);
arrowBody.position.y = -1;
arrowGroup.add(arrowBody);

// Arrow head
const arrowHeadGeometry = new THREE.ConeGeometry(0.3, 0.6, 12);
const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
arrowHead.position.y = 0;
arrowHead.rotation.z = Math.PI;
arrowGroup.add(arrowHead);

arrowGroup.position.set(0, -3.5, 0);
arrowGroup.rotation.x = Math.PI / 2;
coilGroup.add(arrowGroup);

scene.add(coilGroup);
return coilGroup;
};

const coil = createCoil();

// Create magnetic field lines
const createMagneticField = () => {
const fieldGroup = new THREE.Group();

const curvePoints = [];
for (let i = 0; i < 20; i++) {
    const t = i / 19;
    const x = -5 + 10 * t;
    const y = Math.sin(t * Math.PI) * 1.5;
    curvePoints.push(new THREE.Vector3(x, y, 0));
}

for (let z = -3; z <= 3; z += 1) {
    const curve = new THREE.CatmullRomCurve3(
        curvePoints.map(pt => new THREE.Vector3(pt.x, pt.y, z))
    );
    
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({ 
        color: 0x0088ff,
        transparent: true,
        opacity: 0.5
    });
    
    const line = new THREE.Line(geometry, material);
    fieldGroup.add(line);
    
    // Add arrows to show direction
    if (z % 2 === 0) {
        const arrowPos = curve.getPointAt(0.5);
        const tangent = curve.getTangentAt(0.5).normalize();
        
        const arrowHelper = new THREE.ArrowHelper(
            tangent,
            arrowPos,
            0.8,
            0x0088ff,
            0.3,
            0.2
        );
        fieldGroup.add(arrowHelper);
    }
}

scene.add(fieldGroup);
return fieldGroup;
};

const magneticField = createMagneticField();

// Create current flow indicators
const createCurrentIndicators = () => {
const indicatorGroup = new THREE.Group();

// Create dot and cross symbols for current direction
const createSymbol = (position, isDot) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.lineWidth = 8;
    context.strokeStyle = '#000000';
    context.fillStyle = '#000000';
    
    if (isDot) {
        // Draw a dot (current coming out)
        context.beginPath();
        context.arc(64, 64, 32, 0, Math.PI * 2);
        context.fill();
        
        context.beginPath();
        context.arc(64, 64, 48, 0, Math.PI * 2);
        context.stroke();
    } else {
        // Draw an X (current going in)
        context.beginPath();
        context.moveTo(32, 32);
        context.lineTo(96, 96);
        context.stroke();
        
        context.beginPath();
        context.moveTo(96, 32);
        context.lineTo(32, 96);
        context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const geometry = new THREE.CircleGeometry(0.4, 32);
    const symbol = new THREE.Mesh(geometry, material);
    symbol.position.copy(position);
    
    return symbol;
};

// Add current indicators to the coil
const topDot = createSymbol(new THREE.Vector3(0, 2, 3.1), true);
const topCross = createSymbol(new THREE.Vector3(0, 2, -3.1), false);

const bottomDot = createSymbol(new THREE.Vector3(0, -2, -3.1), true);
const bottomCross = createSymbol(new THREE.Vector3(0, -2, 3.1), false);

indicatorGroup.add(topDot);
indicatorGroup.add(topCross);
indicatorGroup.add(bottomDot);
indicatorGroup.add(bottomCross);

coil.add(indicatorGroup);
return indicatorGroup;
};

const currentIndicators = createCurrentIndicators();

// Create force vectors
const createForceVectors = () => {
const forceGroup = new THREE.Group();

// Create upward force on left side
const upArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-3, 0, 0),
    2,
    0x00ff00,
    0.4,
    0.3
);
forceGroup.add(upArrow);

// Create downward force on right side
const downArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(3, 0, 0),
    2,
    0x00ff00,
    0.4,
    0.3
);
forceGroup.add(downArrow);

coil.add(forceGroup);
return forceGroup;
};

const forceVectors = createForceVectors();

// Animation variables
let rotationSpeed = 0;
const maxRotationSpeed = 0.05;
const acceleration = 0.0005;

// Animation loop
function animate() {
requestAnimationFrame(animate);

// Gradually increase rotation speed
if (rotationSpeed < maxRotationSpeed) {
    rotationSpeed += acceleration;
}

// Rotate the coil
coil.rotation.z += rotationSpeed;

// Make magnetic field lines pulse
const time = Date.now() * 0.

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate();
</script>
</body>

</html>