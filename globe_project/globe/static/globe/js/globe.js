// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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

// Click Handler
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(earth);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const latLon = vector3ToLatLon(point);
    addMarker(latLon.lat, latLon.lon);
    saveMarker(latLon.lat, latLon.lon);
  }
});

// Convert 3D
function vector3ToLatLon(vec) {
  const lat = 90 - (Math.acos(vec.y / 1) * 180 / Math.PI);
  const lon = ((Math.atan2(vec.z, vec.x) * 180 / Math.PI) - 180) * -1;
  return { lat, lon };
}

// Load markers on page Load
fetch('/api/markers/')
  .then(res => res.json())
  .then(data => {
    data.forEach(m => addMarker(m.latitude, m.longitude));
  });

// Save marker Function
function saveMarker(lat, lon) {
  fetch('/api/add-marker/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ lat, lon })
  });
}

// Load Borders
fetch('/static/globe/world.geo.json')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(country => {
      country.geometry.coordinates.forEach(polygon => {
        polygon[0].forEach(coord => {
          const pos = latLonToVector3(coord[1], coord[0], 1.001);
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.002),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          dot.position.copy(pos);
          scene.add(dot);
        });
      });
    });
  });

// SATELLITE + DAY/NIGHT EARTH
const nightTexture = new THREE.TextureLoader().load('/static/globe/textures/earth_night.jpg');

const earthMat = new THREE.MeshPhongMaterial({
  map: texture,
  emissiveMap: nightTexture,
  emissiveIntensity: 0.8
});
earth.material = earthMat;

// Add label sprite
function createLabel(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(text, 10, 30);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.5, 0.25, 1);
  return sprite;
}

// Attach label 
const label = createLabel(name);
label.position.copy(position.clone().multiplyScalar(1.05));
scene.add(label);

// REVERSE GEOCODING (City/Country) Use OpenStreetMap Nominatim (free, no API key)
async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
  );
  const data = await res.json();
  return data.display_name || "Unknown location";
}

// On click:
const placeName = await reverseGeocode(lat, lon);
addMarker(lat, lon, placeName);
saveMarker(lat, lon, placeName);

// Market list Panel
function addMarkerToList(name, lat, lon, id) {
  const li = document.createElement('li');
  li.textContent = name;
  li.onclick = () => focusMarker(lat, lon);
  document.getElementById('markerList').appendChild(li);
}

// Delete Markers
function deleteMarker(markerId) {
  fetch(`/api/delete-marker/${markerId}/`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(() => {
    console.log('Marker deleted');
  });
}

// Heatmap Mode
const heatMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.3
});

// Toggle:
let heatmapEnabled = false;

// Mobile Support add touch support automatically via OrbitControls:
controls.enablePan = false;
controls.enableRotate = true;
controls.enableZoom = true;

