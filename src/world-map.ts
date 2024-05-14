import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const MAP_PATH = './BR-states-albedo-world-map.webp';
const IMAGE_PATH = './transparent.webp'
const CONTAINER_ID = 'map_container';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 1.5; // Adjust as needed
camera.position.y = -1; // Adjust as needed
camera.position.z = 2.5; // Adjust as needed
const offsetDistance = -0.01; // Adjust as needed
const imageSize = 0.05; // Adjust as needed

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const htmlMapContainer = document.getElementById(CONTAINER_ID);
htmlMapContainer!.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(2, 32, 32);
const worldTextureLoader = new THREE.TextureLoader();
const worldTexture = worldTextureLoader.load(MAP_PATH);
const worldMaterial = new THREE.MeshBasicMaterial({ map: worldTexture });
const globe = new THREE.Mesh(geometry, worldMaterial);
scene.add(globe);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.rotateSpeed = 0.3;

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
renderer.domElement.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
});
renderer.domElement.addEventListener('mousemove', (event) => {
    if (!isDragging) return;

    // Rotate the globe based on mouse movement
    const deltaX = event.clientX - previousMousePosition.x;
    // const deltaY = event.clientY - previousMousePosition.y;
    camera.rotation.y += deltaX;
    // globe.rotation.y += deltaX * 0.01;

    previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('wheel', (event) => {
    camera.position.z += event.deltaY * 0.001;
});

function generateTransparentImage(path: string, imageSize: number) {
    const imageTexture = new THREE.TextureLoader().load(path);
    const imageMaterial = new THREE.MeshBasicMaterial({
        map: imageTexture,
        transparent: true,
    });
    const imageGeometry = new THREE.PlaneGeometry(imageSize, imageSize);
    const image = new THREE.Mesh(imageGeometry, imageMaterial);
    return image;
}

// renderer.domElement.addEventListener('dblclick', (event) => {
renderer.domElement.addEventListener('click', (event) => {
    const mousePosition = new THREE.Vector2();
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mousePosition.y += 0.25; // add this to add image closer to mouse pointer.

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mousePosition, camera);

    const globeIntersects = raycaster.intersectObject(globe);
    if (globeIntersects.length > 0) {
        const intersectionPoint = globeIntersects[0].point;

        // Calculate the direction vector from the center of the globe to the intersection point
        const directionToCenter = globe.position.clone().sub(intersectionPoint).normalize();

        // Offset the image position slightly above the globe surface
        const imagePosition = intersectionPoint.clone()
            .add(directionToCenter.multiplyScalar(offsetDistance));
        const image = generateTransparentImage(IMAGE_PATH, imageSize);

        image.position.copy(imagePosition);
        image.lookAt(globe.position);
        image.rotateY(Math.PI);
        globe.add(image);
        console.info(`[Log:image]:`, image);
    }
});

// const initialImage = generateTransparentImage(IMAGE_PATH, imageSize);
// scene.add(initialImage);

function renderLoop() {
    requestAnimationFrame(renderLoop);
    controls.update();
    renderer.render(scene, camera);
    // renderer.setClearColor(0x000000, 0);
}
renderLoop();
