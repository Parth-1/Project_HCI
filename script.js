// --- Basic setup ---
const container = document.getElementById('cube-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 7;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Cube constants ---
const CUBE_SIZE = 3;
const CUBIE_SIZE = 1;
const CUBIE_GAP = 0.1;

const colors = {
    white: 0xffffff, yellow: 0xffff00, blue: 0x0000ff,
    green: 0x00ff00, red: 0xff0000, orange: 0xffa500, black: 0x202020
};

const cubies = [];
const cubeGroup = new THREE.Group();

// --- Create the Rubik's Cube ---
function createCube() {
    const materials = [
        new THREE.MeshStandardMaterial({ color: colors.red }),    // +X (R)
        new THREE.MeshStandardMaterial({ color: colors.orange }), // -X (L)
        new THREE.MeshStandardMaterial({ color: colors.white }),  // +Y (U)
        new THREE.MeshStandardMaterial({ color: colors.yellow }), // -Y (D)
        new THREE.MeshStandardMaterial({ color: colors.green }),  // +Z (F)
        new THREE.MeshStandardMaterial({ color: colors.blue }),   // -Z (B)
    ];
    const blackMaterial = new THREE.MeshStandardMaterial({ color: colors.black, roughness: 0.5, metalness: 0.2 });

    for (let x = 0; x < CUBE_SIZE; x++) {
        for (let y = 0; y < CUBE_SIZE; y++) {
            for (let z = 0; z < CUBE_SIZE; z++) {
                if (x > 0 && x < CUBE_SIZE - 1 && y > 0 && y < CUBE_SIZE - 1 && z > 0 && z < CUBE_SIZE - 1) continue;

                const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
                const cubieMaterials = Array(6).fill(null).map(() => blackMaterial.clone());

                if (x === CUBE_SIZE - 1) cubieMaterials[0] = materials[0]; // +X
                if (x === 0) cubieMaterials[1] = materials[1];             // -X
                if (y === CUBE_SIZE - 1) cubieMaterials[2] = materials[2]; // +Y
                if (y === 0) cubieMaterials[3] = materials[3];             // -Y
                if (z === CUBE_SIZE - 1) cubieMaterials[4] = materials[4]; // +Z
                if (z === 0) cubieMaterials[5] = materials[5];             // -Z
                
                const cubie = new THREE.Mesh(geometry, cubieMaterials);
                const offset = (CUBE_SIZE - 1) / 2;
                cubie.position.set(
                    (x - offset) * (CUBIE_SIZE + CUBIE_GAP),
                    (y - offset) * (CUBIE_SIZE + CUBIE_GAP),
                    (z - offset) * (CUBIE_SIZE + CUBIE_GAP)
                );
                
                cubies.push(cubie);
                cubeGroup.add(cubie);
            }
        }
    }
    scene.add(cubeGroup);
}

// --- Rotation logic ---
let isRotating = false;
let isSolving = false;
const animationQueue = [];
let history = [];

function getCubiesForFace(axis, layer) {
    const faceCubies = [];
    const offset = (CUBE_SIZE - 1) / 2;
    const position = (layer - offset) * (CUBIE_SIZE + CUBIE_GAP);
    cubies.forEach(cubie => {
        // Use local position for checking
        if (Math.abs(cubie.position[axis] - position) < 0.1) {
            faceCubies.push(cubie);
        }
    });
    return faceCubies;
}

function rotateFace(axis, layer, direction) {
    if (isRotating) {
        animationQueue.push({ axis, layer, direction });
        return;
    }
    isRotating = true;
    
    if(!isSolving) history.push({ axis, layer, direction });

    const pivot = new THREE.Group();
    scene.add(pivot);
    
    pivot.quaternion.copy(cubeGroup.quaternion);
    pivot.updateMatrixWorld(true);

    const faceCubies = getCubiesForFace(axis, layer);
    faceCubies.forEach(cubie => pivot.attach(cubie));

    const targetAngle = (Math.PI / 2) * direction;
    let currentAngle = 0;
    const animationSpeed = 0.09;

    function animateRotation() {
        const angleToRotate = Math.min(animationSpeed, Math.abs(targetAngle - currentAngle));
        
        if (axis === 'x') pivot.rotateX(angleToRotate * Math.sign(targetAngle));
        if (axis === 'y') pivot.rotateY(angleToRotate * Math.sign(targetAngle));
        if (axis === 'z') pivot.rotateZ(angleToRotate * Math.sign(targetAngle));
        
        currentAngle += angleToRotate;
        
        if (Math.abs(currentAngle) >= Math.abs(targetAngle)) {
            const targetQ = new THREE.Quaternion();
            if (axis === 'x') targetQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngle);
            if (axis === 'y') targetQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            if (axis === 'z') targetQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), targetAngle);
            
            pivot.quaternion.copy(cubeGroup.quaternion).multiply(targetQ);
            pivot.updateMatrixWorld(true);

            const cubiesToUpdate = [...pivot.children];
            for (const cubie of cubiesToUpdate) {
                cubeGroup.attach(cubie);
            }
            
            const step = CUBIE_SIZE + CUBIE_GAP;
            for (const cubie of cubiesToUpdate) {
                cubie.position.x = Math.round(cubie.position.x / step) * step;
                cubie.position.y = Math.round(cubie.position.y / step) * step;
                cubie.position.z = Math.round(cubie.position.z / step) * step;
                
                cubie.quaternion.x = Math.round(cubie.quaternion.x * 2) / 2;
                cubie.quaternion.y = Math.round(cubie.quaternion.y * 2) / 2;
                cubie.quaternion.z = Math.round(cubie.quaternion.z * 2) / 2;
                cubie.quaternion.w = Math.round(cubie.quaternion.w * 2) / 2;
                cubie.quaternion.normalize();
            }

            scene.remove(pivot);
            isRotating = false;

            if (animationQueue.length > 0) {
                const nextMove = animationQueue.shift();
                rotateFace(nextMove.axis, nextMove.layer, nextMove.direction);
            } else {
                isSolving = false;
            }
        } else {
            requestAnimationFrame(animateRotation);
        }
    }
    animateRotation();
}

// --- Controls and Mappings ---

window.addEventListener('keydown', (event) => {
    if (isRotating || !isCubeLocked) return;
    
    const moveKey = event.key.toUpperCase();
    const isShift = event.shiftKey;

    const worldVectors = {
        'U': new THREE.Vector3(0, 1, 0),  // Screen Up
        'D': new THREE.Vector3(0, -1, 0), // Screen Down
        'L': new THREE.Vector3(-1, 0, 0), // Screen Left
        'R': new THREE.Vector3(1, 0, 0),  // Screen Right
        'F': new THREE.Vector3(0, 0, 1),  // Screen Front (towards user)
        'B': new THREE.Vector3(0, 0, -1)  // Screen Back (away from user)
    };

    if (!worldVectors[moveKey]) return; // Not a move key

    const worldVec = worldVectors[moveKey];
    const invQ = cubeGroup.quaternion.clone().invert();
    const localVec = worldVec.clone().applyQuaternion(invQ);

    const { x, y, z } = localVec;
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const az = Math.abs(z);

    let axis;
    let val;

    if (ax > ay && ax > az) {
        axis = 'x';
        val = x;
    } else if (ay > ax && ay > az) {
        axis = 'y';
        val = y;
    } else {
        axis = 'z';
        val = z;
    }

    const layer = (val > 0) ? 2 : 0;

    let direction = (layer === 2) ? -1 : 1;

    if (isShift) {
        direction *= -1;
    }
    
    rotateFace(axis, layer, direction);
});

document.getElementById('scramble-btn').addEventListener('click', scrambleCube);
document.getElementById('solve-btn').addEventListener('click', solveCube);
document.getElementById('reset-btn').addEventListener('click', resetCube);

function scrambleCube() {
    if (isRotating || !isCubeLocked) return;
    history = [];
    const axes = ['x', 'y', 'z'];
    for (let i = 0; i < 25; i++) {
        const randomAxis = axes[Math.floor(Math.random() * axes.length)];
        const randomLayer = Math.random() < 0.5 ? 0 : 2; // Only outer layers
        const randomDirection = Math.random() < 0.5 ? 1 : -1;
        animationQueue.push({ axis: randomAxis, layer: randomLayer, direction: randomDirection });
    }
    if (animationQueue.length > 0 && !isRotating) {
        const nextMove = animationQueue.shift();
        rotateFace(nextMove.axis, nextMove.layer, nextMove.direction);
    }
}

function solveCube() {
    if (isRotating || !isCubeLocked) return;
    isSolving = true;
    const solveMoves = [...history].reverse();
    solveMoves.forEach(move => {
        animationQueue.push({ ...move, direction: -move.direction });
    });
    history = [];
    if (animationQueue.length > 0 && !isRotating) {
        const nextMove = animationQueue.shift();
        rotateFace(nextMove.axis, nextMove.layer, nextMove.direction);
    }
}

function resetCube() {
    if (isRotating) return;
    animationQueue.length = 0;
    history = [];
    isSolving = false;

    while(cubeGroup.children.length > 0) cubeGroup.remove(cubeGroup.children[0]);
    cubies.length = 0;
    cubeGroup.quaternion.set(0, 0, 0, 1); // Ensure it's perfectly oriented
    createCube();
    
    isCubeLocked = true;
    updateStatusIndicator();
}

// --- Locking Mechanism & Mouse Controls ---
let isCubeLocked = true;
const statusIndicator = document.getElementById('status');
let currentLockQuaternion = new THREE.Quaternion(); // Stores the snapped orientation

let isMouseDown = false;
let previousMousePosition = { x: 0, y: 0 };

function updateStatusIndicator() {
    if (isCubeLocked) {
        statusIndicator.textContent = 'LOCKED';
        statusIndicator.classList.remove('unlocked');
        statusIndicator.classList.add('locked');
    } else {
        statusIndicator.textContent = 'UNLOCKED';
        statusIndicator.classList.remove('locked');
        statusIndicator.classList.add('unlocked');
    }
}

// **NEW**: Function to snap cubeGroup to nearest 90-degree angle on its axes
function snapCubeToOrthogonal() {
    const currentQuaternion = cubeGroup.quaternion;
    const euler = new THREE.Euler().setFromQuaternion(currentQuaternion, 'XYZ');

    // Round angles to nearest multiple of PI/2 (90 degrees)
    euler.x = Math.round(euler.x / (Math.PI / 2)) * (Math.PI / 2);
    euler.y = Math.round(euler.y / (Math.PI / 2)) * (Math.PI / 2);
    euler.z = Math.round(euler.z / (Math.PI / 2)) * (Math.PI / 2);

    const snappedQuaternion = new THREE.Quaternion().setFromEuler(euler);
    currentLockQuaternion.copy(snappedQuaternion); // Store this as the new lock orientation
}


function handleStart(clientX, clientY) {
    isMouseDown = true;
    isCubeLocked = false;
    updateStatusIndicator();
    previousMousePosition = { x: clientX, y: clientY };
}

function handleEnd() {
    if (isMouseDown) {
        isCubeLocked = true;
        updateStatusIndicator();
        // **MODIFIED**: Trigger the snap to orthogonal here
        snapCubeToOrthogonal();
    }
    isMouseDown = false;
}

function handleMove(clientX, clientY) {
    if (!isMouseDown) return;
    
    const deltaMove = { x: clientX - previousMousePosition.x, y: clientY - previousMousePosition.y };
    const rotateAngleX = deltaMove.y * 0.01;
    const rotateAngleY = deltaMove.x * 0.01;
    
    const cameraX = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const cameraY = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    
    const qX = new THREE.Quaternion().setFromAxisAngle(cameraX, rotateAngleX);
    const qY = new THREE.Quaternion().setFromAxisAngle(cameraY, rotateAngleY);
    
    cubeGroup.quaternion.multiplyQuaternions(qX, cubeGroup.quaternion);
    cubeGroup.quaternion.multiplyQuaternions(qY, cubeGroup.quaternion);

    previousMousePosition = { x: clientX, y: clientY };
}

renderer.domElement.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
renderer.domElement.addEventListener('mouseup', handleEnd);
renderer.domElement.addEventListener('mouseleave', handleEnd);
renderer.domElement.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
renderer.domElement.addEventListener('touchstart', e => handleStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
renderer.domElement.addEventListener('touchend', handleEnd);
renderer.domElement.addEventListener('touchmove', e => {
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
}, { passive: false });

// --- Window resize handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation loop ---
function animate() {
    requestAnimationFrame(animate);

    // **MODIFIED**: Animate towards the `currentLockQuaternion` only when locked
    if (isCubeLocked && cubeGroup.quaternion.angleTo(currentLockQuaternion) > 0.001) {
        cubeGroup.quaternion.slerp(currentLockQuaternion, 0.1);
    }

    renderer.render(scene, camera);
}

createCube();
// Set initial lock quaternion to identity (straight)
currentLockQuaternion.set(0,0,0,1);
updateStatusIndicator();
animate();