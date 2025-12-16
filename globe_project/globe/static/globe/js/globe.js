// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Earth
const geometry = new THREE.SphereGeometry(1, 64, 64);
const texture = new THREE.TextureLoader().load('/static/globe/textures/earth.jpg');
const material = new THREE.MeshStandardMaterial({ map: texture });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Light
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 3, 5);
scene.add(light);

// Convert lat/lon to 3D position
function latLonToVector3(lat, lon, radius = 1.01) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Add marker
function addMarker() {
  const lat = parseFloat(document.getElementById("lat").value);
  const lon = parseFloat(document.getElementById("lon").value);

  const markerGeo = new THREE.SphereGeometry(0.02, 16, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const marker = new THREE.Mesh(markerGeo, markerMat);

  const position = latLonToVector3(lat, lon);
  marker.position.copy(position);
  scene.add(marker);
}

//Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;
controls.minDistance = 1.5;
controls.maxDistance = 5;


// Animation
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0005;
  renderer.render(scene, camera);
  controls.update();
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});