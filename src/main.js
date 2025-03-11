import * as THREE from 'three';

// Debug flag
const DEBUG = true;

// Error handling wrapper
function initGame() {
    try {
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = null; // Ensure sky background is transparent
        
        if (DEBUG) console.log('Scene created');

        // Camera setup
        const camera = new THREE.OrthographicCamera(
            window.innerWidth / -2, window.innerWidth / 2,
            window.innerHeight / 2, window.innerHeight / -2,
            0.1, 1000
        );
        camera.position.set(0, 200, 200);  // Move camera higher and back for bird's-eye view
        camera.lookAt(0, 0, 0);  // Ensure camera looks at the scene center
        
        if (DEBUG) console.log('Camera created:', camera.position);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0); // Set clear color to transparent
        document.body.appendChild(renderer.domElement);
        
        if (DEBUG) console.log('Renderer created');

        // Basic shape for testing visibility
        const testGeometry = new THREE.PlaneGeometry(100, 100);
        const testMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            side: THREE.DoubleSide
        });
        const testMesh = new THREE.Mesh(testGeometry, testMaterial);
        scene.add(testMesh);
        
        if (DEBUG) console.log('Test mesh added');

        // Simple animation loop
        function testAnimate() {
            requestAnimationFrame(testAnimate);
            if (DEBUG) console.log('Rendering frame');
            renderer.render(scene, camera);
        }

        // Start animation
        testAnimate();
        
        if (DEBUG) console.log('Animation started');

    } catch (error) {
        console.error('Game initialization failed:', error);
    }
}

// Start the game
window.addEventListener('load', () => {
    console.log('Window loaded, starting game...');
    initGame();
});

// Scene setup
const scene = new THREE.Scene();
scene.background = null; // Ensure sky background is transparent

// Camera setup
const camera = new THREE.OrthographicCamera(
    window.innerWidth / -2, window.innerWidth / 2,
    window.innerHeight / 2, window.innerHeight / -2,
    0.1, 1000
);
camera.position.set(0, 200, 200);  // Move camera higher and back for bird's-eye view
camera.lookAt(0, 0, 0);  // Ensure camera looks at the scene center

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Set clear color to transparent
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Softer ambient light
scene.add(ambientLight);

// Add directional light for shadows
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 100, 50);
light.castShadow = true;
light.shadow.camera.left = -window.innerWidth/2;
light.shadow.camera.right = window.innerWidth/2;
light.shadow.camera.top = window.innerHeight/2;
light.shadow.camera.bottom = -window.innerHeight/2;
light.shadow.camera.near = 1;
light.shadow.camera.far = 1000;
light.shadow.mapSize.width = 4096; // Higher resolution shadows
light.shadow.mapSize.height = 4096;
scene.add(light);

// Game state
const gameState = {
    score: 0,
    health: 5, // Initial health
    maxHealth: 7, // Maximum health limit
    invulnerable: false, // Invulnerability after getting hit
    invulnerabilityDuration: 2000, // 2 seconds of invulnerability
    lastHitTime: 0,
    bullets: [],
    bombs: [],
    enemies: [],
    groundElements: [],
    tanks: [],
    explosions: [],
    items: [],
    lastEnemySpawn: 0,
    lastGroundSpawn: 0,
    lastTankSpawn: 0,
    lastItemSpawn: 0,
    enemySpawnInterval: 1000, // ms
    groundSpawnInterval: 2000, // ms
    tankSpawnInterval: 3000, // ms
    itemSpawnInterval: 5000, // ms
    bulletSpeed: 8,
    bombSpeed: 10,  // Increased bomb speed
    enemySpeed: 3,
    scrollSpeed: 2,
    playerRotation: 0,
    targetPlayerRotation: 0,
    // Power-up states
    bulletSize: 3,
    bulletCount: 1,
    bulletSpeedMultiplier: 1,
    enemyTypes: ['basic', 'fast', 'tank', 'bomber'],
    enemyColors: {
        basic: 0xFF6B6B,    // Soft red
        fast: 0xFFB347,     // Pastel orange
        tank: 0x98FB98,     // Pale green
        bomber: 0xDDA0DD    // Plum
    },
    enemyStats: {
        basic: { speed: 3, health: 1, score: 100, size: 1 },
        fast: { speed: 5, health: 1, score: 150, size: 0.8 },
        tank: { speed: 2, health: 3, score: 300, size: 1.3 },
        bomber: { speed: 2.5, health: 2, score: 200, size: 1.1 }
    }
};

// Load desert texture
const textureLoader = new THREE.TextureLoader();
const desertTexture = textureLoader.load('path/to/desert_texture.jpg'); // Replace with actual path to texture

// Create ground with desert texture
function createGround(x, y) {
    const group = new THREE.Group();
    
    // Ground base
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: desertTexture, // Apply desert texture
        metalness: 0.1,
        roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    group.add(ground);
    
    group.position.set(x, y, -1); // Position ground below other elements
    return group;
}

// Create player airplane
function createPlayerAirplane() {
    const group = new THREE.Group();

    // Main body (more rounded)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0, 25);        // Nose
    bodyShape.bezierCurveTo(20, 15, 20, -15, 0, -15);  // Right side
    bodyShape.bezierCurveTo(-20, -15, -20, 15, 0, 25); // Left side

    const bodyGeometry = new THREE.ShapeGeometry(bodyShape);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4169E1,  // Royal Blue
        metalness: 0.5,
        roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.receiveShadow = true;
    body.castShadow = true;

    // Cockpit
    const cockpitShape = new THREE.Shape();
    cockpitShape.arc(0, 5, 6, 0, Math.PI * 2);
    const cockpitGeometry = new THREE.ShapeGeometry(cockpitShape);
    const cockpitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87CEFA,  // Light Sky Blue
        side: THREE.DoubleSide
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);

    // Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 5);
    wingShape.lineTo(25, -5);
    wingShape.lineTo(20, -10);
    wingShape.lineTo(0, 0);
    wingShape.lineTo(-20, -10);
    wingShape.lineTo(-25, -5);
    wingShape.lineTo(0, 5);

    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x6495ED,  // Cornflower Blue
        side: THREE.DoubleSide
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);

    group.add(body);
    group.add(cockpit);
    group.add(wings);
    
    // Position the player lower in the scene
    group.position.set(0, -100, 0);
    
    console.log('Player created at position:', group.position);
    return group;
}

// Create bullet with trail effect
function createBullet(position, offset = 0) {
    const group = new THREE.Group();

    // Main bullet
    const bulletGeometry = new THREE.CircleGeometry(gameState.bulletSize, 16);
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF6B6B,  // Soft Red
        side: THREE.DoubleSide
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Bullet trail
    const trailShape = new THREE.Shape();
    trailShape.moveTo(-gameState.bulletSize/2, 0);
    trailShape.lineTo(gameState.bulletSize/2, 0);
    trailShape.lineTo(0, -10);
    trailShape.lineTo(-gameState.bulletSize/2, 0);

    const trailGeometry = new THREE.ShapeGeometry(trailShape);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFA07A,  // Light Salmon
        transparent: true,
        opacity: 0.6
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.y = -5;

    group.add(bullet);
    group.add(trail);
    group.position.copy(position);
    group.position.y += 20;
    group.position.x += offset;
    return group;
}

// Create enemy with more cartoon-like detail and variations
function createEnemy() {
    const group = new THREE.Group();
    
    // Randomly select enemy type
    const type = gameState.enemyTypes[Math.floor(Math.random() * gameState.enemyTypes.length)];
    const stats = gameState.enemyStats[type];
    
    // Enemy body with type-specific shape
    const bodyShape = new THREE.Shape();
    switch(type) {
        case 'basic':
            // Cute rounded shape
            bodyShape.moveTo(0, 15);
            bodyShape.bezierCurveTo(15, 15, 20, 0, 15, -10);
            bodyShape.bezierCurveTo(10, -15, -10, -15, -15, -10);
            bodyShape.bezierCurveTo(-20, 0, -15, 15, 0, 15);
            break;
        case 'fast':
            // Sleek teardrop shape
            bodyShape.moveTo(0, 20);
            bodyShape.bezierCurveTo(10, 15, 15, 0, 10, -10);
            bodyShape.bezierCurveTo(5, -15, -5, -15, -10, -10);
            bodyShape.bezierCurveTo(-15, 0, -10, 15, 0, 20);
            break;
        case 'tank':
            // Chunky rounded rectangle
            bodyShape.moveTo(-15, 15);
            bodyShape.bezierCurveTo(-10, 20, 10, 20, 15, 15);
            bodyShape.bezierCurveTo(20, 10, 20, -10, 15, -15);
            bodyShape.bezierCurveTo(10, -20, -10, -20, -15, -15);
            bodyShape.bezierCurveTo(-20, -10, -20, 10, -15, 15);
            break;
        case 'bomber':
            // Wide UFO-like shape with patterns
            bodyShape.moveTo(0, 10);
            bodyShape.bezierCurveTo(20, 10, 30, 0, 25, -5);
            bodyShape.bezierCurveTo(20, -10, -20, -10, -25, -5);
            bodyShape.bezierCurveTo(-30, 0, -20, 10, 0, 10);
            break;
    }

    const bodyGeometry = new THREE.ShapeGeometry(bodyShape);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: gameState.enemyColors[type],
        metalness: 0.3,
        roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.scale.setScalar(stats.size);

    // Add type-specific details
    if (type === 'bomber') {
        // Add wing stripes
        const patternGroup = new THREE.Group();
        for (let i = -20; i <= 20; i += 10) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(5, 2),
                new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
            );
            stripe.position.set(i, -5, 1);
            patternGroup.add(stripe);
        }
        group.add(patternGroup);
    }

    group.add(body);
    group.position.set(
        Math.random() * (window.innerWidth - 100) - (window.innerWidth/2 - 50),
        window.innerHeight/2,
        0
    );
    
    group.enemyType = type;
    group.health = stats.health;
    group.speed = stats.speed;
    group.scoreValue = stats.score;
    
    return group;
}

// Create tank with cartoon style (rotated to face downward)
function createTank(x, y) {
    const group = new THREE.Group();
    
    // Tank body - rounded rectangle (rotated 180 degrees)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-10, 15);  // Start at top left
    bodyShape.bezierCurveTo(-15, 15, -15, -15, -10, -15);  // Left side
    bodyShape.lineTo(10, -15);  // Bottom
    bodyShape.bezierCurveTo(15, -15, 15, 15, 10, 15);  // Right side
    bodyShape.lineTo(-10, 15);  // Top
    
    const bodyGeometry = new THREE.ShapeGeometry(bodyShape);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4A5D4A,  // Darker military green
        metalness: 0.2,
        roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    
    // Tank turret - pointing downward
    const turretShape = new THREE.Shape();
    turretShape.moveTo(-8, 0);  // Top left
    turretShape.lineTo(8, 0);   // Top right
    turretShape.lineTo(5, -15);  // Bottom right
    turretShape.lineTo(-5, -15); // Bottom left
    turretShape.lineTo(-8, 0);  // Back to start
    
    const turretGeometry = new THREE.ShapeGeometry(turretShape);
    const turretMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3A4A3A,  // Even darker green
        side: THREE.DoubleSide,
        shininess: 60
    });
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.castShadow = true;
    
    // Tank cannon - pointing downward
    const cannonShape = new THREE.Shape();
    cannonShape.moveTo(-2, -15);   // Top left
    cannonShape.lineTo(2, -15);    // Top right
    cannonShape.lineTo(2, -25);    // Bottom right
    cannonShape.lineTo(-2, -25);   // Bottom left
    cannonShape.lineTo(-2, -15);   // Back to start
    
    const cannonGeometry = new THREE.ShapeGeometry(cannonShape);
    const cannonMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2A3A2A,  // Darkest green
        side: THREE.DoubleSide,
        shininess: 70
    });
    const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.castShadow = true;

    // Tank tracks - on sides with more detail
    const trackGroup = new THREE.Group();
    [-12, 12].forEach(xOffset => {  // Left and right tracks
        // Main track body
        const trackBody = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 30),
            new THREE.MeshPhongMaterial({ 
                color: 0x1A2A1A,
                side: THREE.DoubleSide,
                shininess: 40
            })
        );
        trackBody.position.set(xOffset, 0, 0);
        trackGroup.add(trackBody);

        // Track segments
        for(let i = -12; i <= 12; i += 4) {
            // Track segment with groove
            const segment = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 2),
                new THREE.MeshPhongMaterial({ 
                    color: 0x2A2A2A,
                    side: THREE.DoubleSide,
                    shininess: 60
                })
            );
            segment.position.set(xOffset, i, 1);
            trackGroup.add(segment);
            
            // Track wheel with metallic look
            const wheel = new THREE.Mesh(
                new THREE.CircleGeometry(2, 16),
                new THREE.MeshPhongMaterial({ 
                    color: 0x3A3A3A,
                    shininess: 90,
                    specular: 0x333333
                })
            );
            wheel.position.set(xOffset, i, 2);
            trackGroup.add(wheel);
        }
    });
    
    group.add(body);
    group.add(turret);
    group.add(cannon);
    group.add(trackGroup);
    
    group.position.set(x, y, 0);
    
    // Add tank shooting properties
    group.lastShot = 0;
    group.shootingCooldown = 2000;
    
    return group;
}

// Create tank bullet creation
function createTankBullet(position) {
    const bullet = new THREE.Mesh(
        new THREE.CircleGeometry(3, 8),
        new THREE.MeshPhongMaterial({ 
            color: 0xFF4400,
            side: THREE.DoubleSide,
            shininess: 30
        })
    );
    bullet.position.copy(position);
    bullet.position.y -= 25; // Spawn at cannon tip (now facing down)
    return bullet;
}

// Update tank behavior in updateGameObjects
function updateTanks() {
    for (let i = gameState.tanks.length - 1; i >= 0; i--) {
        const tank = gameState.tanks[i];
        tank.position.y -= gameState.scrollSpeed;
        
        // Tank shooting logic
        const now = Date.now();
        if (now - tank.lastShot >= tank.shootingCooldown) {
            const bullet = createTankBullet(tank.position);
            scene.add(bullet);
            gameState.enemyBullets = gameState.enemyBullets || [];
            gameState.enemyBullets.push(bullet);
            tank.lastShot = now;
        }
        
        // Check collision with bombs
        for (let j = gameState.bombs.length - 1; j >= 0; j--) {
            const bomb = gameState.bombs[j];
            if (checkCollision(bomb, tank)) {
                createExplosion(tank.position, 0xff6600); // Orange explosion
                scene.remove(tank);
                scene.remove(bomb);
                gameState.tanks.splice(i, 1);
                gameState.bombs.splice(j, 1);
                gameState.score += 300;
                updateScore();
                break;
            }
        }
        
        // Remove tanks that are off screen
        if (tank.position.y < -window.innerHeight/2 - 100) {
            scene.remove(tank);
            gameState.tanks.splice(i, 1);
        }
    }
    
    // Update tank bullets
    if (gameState.enemyBullets) {
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = gameState.enemyBullets[i];
            bullet.position.y -= 5; // Move downward
            
            // Check collision with player
            if (checkCollision(bullet, player)) {
                handleDamage();
                createExplosion(bullet.position, 0xFF0000, 0.5);
                scene.remove(bullet);
                gameState.enemyBullets.splice(i, 1);
                continue;
            }
            
            // Remove bullets that are off screen
            if (bullet.position.y < -window.innerHeight/2) {
                scene.remove(bullet);
                gameState.enemyBullets.splice(i, 1);
            }
        }
    }
}

// Create bomb (modified for forward trajectory)
function createBomb(position) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 8);     // Nose
    shape.lineTo(4, 0);     // Body
    shape.lineTo(4, -8);    // Tail right
    shape.lineTo(-4, -8);   // Tail left
    shape.lineTo(-4, 0);    // Body
    shape.lineTo(0, 8);     // Back to nose

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x333333,  // Dark grey for bombs
        side: THREE.DoubleSide
    });

    const bomb = new THREE.Mesh(geometry, material);
    bomb.position.copy(position);
    bomb.position.y += 20; // Spawn at nose of plane
    return bomb;
}

// Create tree with enhanced photorealistic details
function createTree(x, y) {
    const group = new THREE.Group();
    
    // Tree trunk with bark texture effect
    const trunkShape = new THREE.Shape();
    trunkShape.moveTo(-6, 0);
    trunkShape.bezierCurveTo(-7, 0, -5, 35, -4, 35);  // Left curve
    trunkShape.bezierCurveTo(-3, 35, 3, 35, 4, 35);   // Top curve
    trunkShape.bezierCurveTo(5, 35, 7, 0, 6, 0);      // Right curve
    trunkShape.lineTo(-6, 0);                         // Bottom
    
    const trunkGeometry = new THREE.ShapeGeometry(trunkShape);
    const trunkMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x5C4033,  // Rich brown
        side: THREE.DoubleSide,
        shininess: 10
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Multiple layers of foliage for depth
    const foliageLayers = 3;
    const foliageColors = [0x1B4D3E, 0x2D5A27, 0x355E3B];  // Different shades of green
    
    for (let i = 0; i < foliageLayers; i++) {
        const topShape = new THREE.Shape();
        const size = 20 - i * 2;  // Decreasing size for each layer
        const height = 40 + i * 10;  // Increasing height for each layer
        
        // Create irregular, organic shape for foliage
        topShape.moveTo(-size, height - size);
        
        // Add multiple curved segments for natural look
        for (let j = 0; j < 8; j++) {
            const angle = (j / 8) * Math.PI * 2;
            const nextAngle = ((j + 1) / 8) * Math.PI * 2;
            const radius = size * (0.8 + Math.random() * 0.4);
            const nextRadius = size * (0.8 + Math.random() * 0.4);
            
            const x1 = Math.cos(angle) * radius;
            const y1 = height - size + Math.sin(angle) * radius;
            const x2 = Math.cos(nextAngle) * nextRadius;
            const y2 = height - size + Math.sin(nextAngle) * nextRadius;
            
            topShape.bezierCurveTo(
                x1, y1,
                (x1 + x2) / 2, height + radius / 2,
                x2, y2
            );
        }
        
        const topGeometry = new THREE.ShapeGeometry(topShape);
        const topMaterial = new THREE.MeshPhongMaterial({ 
            color: foliageColors[i],
            side: THREE.DoubleSide,
            shininess: 15,
            transparent: true,
            opacity: 0.9
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.castShadow = true;
        top.receiveShadow = true;
        group.add(top);
    }
    
    group.add(trunk);
    group.position.set(x, y, 0);
    return group;
}

// Create grass with enhanced photorealistic details
function createGrass(x, y) {
    const group = new THREE.Group();
    
    // Create multiple detailed grass blades
    const bladeCount = 8;  // More blades for density
    const grassColors = [0x355E3B, 0x2D5A27, 0x3A9D23, 0x4A7023];  // Various grass shades
    
    for (let i = 0; i < bladeCount; i++) {
        const grassShape = new THREE.Shape();
        const xOffset = (Math.random() - 0.5) * 15;
        const height = 15 + Math.random() * 10;  // Varied heights
        const width = 1 + Math.random();  // Varied widths
        
        // Create curved blade shape
        grassShape.moveTo(xOffset, 0);
        grassShape.bezierCurveTo(
            xOffset + width, height * 0.3,  // First control point
            xOffset + width * 2, height * 0.7,  // Second control point
            xOffset + (Math.random() - 0.5) * 3, height  // End point with random lean
        );
        grassShape.lineTo(xOffset - width, height * 0.95);
        grassShape.bezierCurveTo(
            xOffset - width * 2, height * 0.7,
            xOffset - width, height * 0.3,
            xOffset, 0
        );
        
        const grassGeometry = new THREE.ShapeGeometry(grassShape);
        const grassMaterial = new THREE.MeshPhongMaterial({ 
            color: grassColors[Math.floor(Math.random() * grassColors.length)],
            side: THREE.DoubleSide,
            shininess: 20,
            transparent: true,
            opacity: 0.9
        });
        const blade = new THREE.Mesh(grassGeometry, grassMaterial);
        blade.castShadow = true;
        blade.receiveShadow = true;
        
        // Add slight random rotation for natural look
        blade.rotation.z = (Math.random() - 0.5) * 0.2;
        
        group.add(blade);
    }
    
    group.position.set(x, y, 0);
    return group;
}

// Create heart item
function createHeartItem(x, y) {
    const group = new THREE.Group();
    
    // Heart shape
    const heartShape = new THREE.Shape();
    
    // Create heart curve
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(-3, 3, -6, 5, 0, 9);
    heartShape.bezierCurveTo(6, 5, 3, 3, 0, 0);
    
    const geometry = new THREE.ShapeGeometry(heartShape);
    const material = new THREE.MeshPhongMaterial({
        color: 0xFF69B4, // Hot pink
        side: THREE.DoubleSide,
        shininess: 50
    });
    
    const heart = new THREE.Mesh(geometry, material);
    heart.scale.setScalar(1.2); // Make heart slightly larger
    
    group.add(heart);
    group.position.set(x, y, 0);
    group.itemType = 'heart';
    
    return group;
}

// Create and add player
const player = createPlayerAirplane();
scene.add(player);
console.log('Scene children count:', scene.children.length);

// Add initial enemy and ground elements
const initialEnemy = createEnemy();
scene.add(initialEnemy);
gameState.enemies.push(initialEnemy);

const initialGround = createTree(0, 0);
scene.add(initialGround);
gameState.groundElements.push(initialGround);

console.log('Initial objects added to scene');

// Player movement
const playerSpeed = 5;
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    KeyB: false
};

// Key listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
    if (e.code === 'KeyB') {
        dropBomb();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Update player position
function updatePlayer() {
    let moving = false;
    
    if (keys.ArrowLeft && player.position.x > -window.innerWidth/2 + 20) {
        player.position.x -= playerSpeed;
        gameState.targetPlayerRotation = -0.3; // Bank left
        moving = true;
    }
    if (keys.ArrowRight && player.position.x < window.innerWidth/2 - 20) {
        player.position.x += playerSpeed;
        gameState.targetPlayerRotation = 0.3; // Bank right
        moving = true;
    }
    if (keys.ArrowUp && player.position.y < window.innerHeight/2 - 20) {
        player.position.y += playerSpeed;
        moving = true;
    }
    if (keys.ArrowDown && player.position.y > -window.innerHeight/2 + 20) {
        player.position.y -= playerSpeed;
        moving = true;
    }
    
    // Return to neutral position when not moving horizontally
    if (!keys.ArrowLeft && !keys.ArrowRight) {
        gameState.targetPlayerRotation = 0;
    }
    
    // Smooth rotation animation
    gameState.playerRotation += (gameState.targetPlayerRotation - gameState.playerRotation) * 0.1;
    player.rotation.z = gameState.playerRotation;
    
    // Add slight wobble effect when moving
    if (moving) {
        player.position.x += Math.sin(Date.now() * 0.01) * 0.2;
    }
    
    // Shooting
    if (keys.Space) {
        shoot();
    }
}

// Shooting mechanics
let lastShot = 0;
const shootingCooldown = 250; // ms between shots

function shoot() {
    const now = Date.now();
    if (now - lastShot >= shootingCooldown) {
        // Calculate offsets for multiple bullets
        const offsets = [];
        if (gameState.bulletCount === 1) {
            offsets.push(0);
        } else if (gameState.bulletCount === 2) {
            offsets.push(-10, 10);
        } else if (gameState.bulletCount === 3) {
            offsets.push(-15, 0, 15);
        }
        
        // Create bullets with offsets
        offsets.forEach(offset => {
            const bullet = createBullet(player.position, offset);
            scene.add(bullet);
            gameState.bullets.push(bullet);
        });
        
        lastShot = now;
    }
}

// Bomb dropping mechanics
let lastBomb = 0;
const bombCooldown = 1000; // ms between bombs

function dropBomb() {
    const now = Date.now();
    if (now - lastBomb >= bombCooldown) {
        const bomb = createBomb(player.position);
        scene.add(bomb);
        gameState.bombs.push(bomb);
        lastBomb = now;
    }
}

// Update scene background color to differentiate sky
// scene.background = new THREE.Color(0x87CEEB); // Sky blue

// Update spawnGroundElements to use createGround
function spawnGroundElements() {
    const now = Date.now();
    if (now - gameState.lastGroundSpawn > gameState.groundSpawnInterval) {
        // Spawn at top of screen
        const x = Math.random() * (window.innerWidth - 100) - (window.innerWidth/2 - 50);
        const y = window.innerHeight/2;
        
        // Use createGround instead of createTree or createGrass
        const ground = createGround(x, y);
        scene.add(ground);
        gameState.groundElements.push(ground);
        gameState.lastGroundSpawn = now;
    }
}

// Spawn tanks
function spawnTanks() {
    const now = Date.now();
    if (now - gameState.lastTankSpawn > gameState.tankSpawnInterval) {
        // Spawn at top of screen
        const x = Math.random() * (window.innerWidth - 100) - (window.innerWidth/2 - 50);
        const y = window.innerHeight/2;
        
        const tank = createTank(x, y);
        scene.add(tank);
        gameState.tanks.push(tank);
        gameState.lastTankSpawn = now;
    }
}

// Create explosion effect with more particles and colors
function createExplosion(position, color = 0xff4500, scale = 1.0) {
    const group = new THREE.Group();
    const particles = [];
    const particleCount = 20;  // Increased particle count
    
    const colors = [color, 0xFFD700, 0xFFA500];  // Multiple colors
    
    for (let i = 0; i < particleCount; i++) {
        const size = (Math.random() * 3 + 1) * scale;
        const particle = new THREE.Mesh(
            new THREE.CircleGeometry(size, 8),
            new THREE.MeshBasicMaterial({ 
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true
            })
        );
        
        const angle = (Math.PI * 2 / particleCount) * i;
        const speed = Math.random() * 2 + 2;
        
        particle.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        particles.push(particle);
        group.add(particle);
    }
    
    group.position.copy(position);
    group.particles = particles;
    group.createdAt = Date.now();
    group.lifetime = 1500;  // Longer lifetime
    
    scene.add(group);
    gameState.explosions.push(group);
}

// Spawn items
function spawnItems() {
    const now = Date.now();
    if (now - gameState.lastItemSpawn > gameState.itemSpawnInterval) {
        const x = Math.random() * (window.innerWidth - 100) - (window.innerWidth/2 - 50);
        const y = window.innerHeight/2;
        
        // Add heart to possible item types
        const types = ['size', 'count', 'speed', 'heart'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const item = createItem(x, y, type);
        scene.add(item);
        gameState.items.push(item);
        gameState.lastItemSpawn = now;
    }
}

// Apply power-up effect
function applyPowerUp(type) {
    switch(type) {
        case 'size':
            gameState.bulletSize = Math.min(gameState.bulletSize + 1, 6);
            break;
        case 'count':
            gameState.bulletCount = Math.min(gameState.bulletCount + 1, 3);
            break;
        case 'speed':
            gameState.bulletSpeedMultiplier = Math.min(gameState.bulletSpeedMultiplier + 0.5, 2.5);
            break;
    }
}

// Add snake enemy type
function createSnakeEnemy() {
    const group = new THREE.Group();
    
    // Snake body segments
    const segmentCount = 5;
    const segmentGeometry = new THREE.CylinderGeometry(5, 5, 20, 8);
    const segmentMaterial = new THREE.MeshPhongMaterial({
        color: 0x228B22, // Forest green
        side: THREE.DoubleSide,
        shininess: 30
    });
    
    for (let i = 0; i < segmentCount; i++) {
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.y = -i * 20; // Stack segments vertically
        group.add(segment);
    }
    
    group.position.set(
        Math.random() * (window.innerWidth - 100) - (window.innerWidth/2 - 50),
        window.innerHeight/2,
        0
    );
    
    group.enemyType = 'snake';
    group.speed = 2;
    group.movementPhase = 0;
    
    return group;
}

// Update enemies with type-specific behavior
function updateEnemies() {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        enemy.position.y -= enemy.speed;
        
        // Type-specific movement patterns
        switch(enemy.enemyType) {
            case 'basic':
                // Simple sine wave movement
                enemy.position.x += Math.sin(Date.now() * 0.003 + enemy.position.y * 0.1) * 1;
                break;
            case 'fast':
                // Aggressive zigzag
                enemy.position.x += Math.sin(Date.now() * 0.006 + enemy.position.y * 0.2) * 2;
                break;
            case 'tank':
                // Minimal movement, straight path
                enemy.position.x += Math.sin(Date.now() * 0.001) * 0.5;
                break;
            case 'bomber':
                // Wide sweeping movement
                enemy.position.x += Math.sin(Date.now() * 0.002 + enemy.position.y * 0.05) * 3;
                break;
            case 'snake':
                // Snake-like movement
                enemy.movementPhase += 0.1;
                enemy.position.x += Math.sin(enemy.movementPhase) * 5;
                break;
        }
        
        // Check collision with player
        if (checkCollision(enemy, player)) {
            handleDamage();
            createExplosion(enemy.position, gameState.enemyColors[enemy.enemyType]);
            scene.remove(enemy);
            gameState.enemies.splice(i, 1);
            continue;
        }
        
        // Check collision with bullets
        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const bullet = gameState.bullets[j];
            if (checkCollision(enemy, bullet)) {
                enemy.health--;
                scene.remove(bullet);
                gameState.bullets.splice(j, 1);
                
                // Create hit effect
                createExplosion(bullet.position, 0xFFFF00, 0.5); // Small yellow flash
                
                if (enemy.health <= 0) {
                    createExplosion(enemy.position, gameState.enemyColors[enemy.enemyType]);
                    scene.remove(enemy);
                    gameState.enemies.splice(i, 1);
                    gameState.score += enemy.scoreValue;
                    updateScore();
                    break;
                }
            }
        }
        
        // Remove enemies that are off screen
        if (enemy.position.y < -window.innerHeight/2) {
            scene.remove(enemy);
            gameState.enemies.splice(i, 1);
        }
    }
}

// Update game objects
function updateGameObjects() {
    // Update explosions
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        const age = Date.now() - explosion.createdAt;
        
        if (age > explosion.lifetime) {
            scene.remove(explosion);
            gameState.explosions.splice(i, 1);
            continue;
        }
        
        // Update each particle
        const progress = age / explosion.lifetime;
        explosion.particles.forEach(particle => {
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
            particle.material.opacity = 1 - progress;
            particle.scale.setScalar(1 - progress);
        });
    }
    
    // Update ground elements
    for (let i = gameState.groundElements.length - 1; i >= 0; i--) {
        const element = gameState.groundElements[i];
        element.position.y -= gameState.scrollSpeed;
        
        // Remove elements that are off screen
        if (element.position.y < -window.innerHeight/2 - 100) {
            scene.remove(element);
            gameState.groundElements.splice(i, 1);
        }
    }
    
    // Update tanks with destruction effect
    updateTanks();
    
    // Update bombs
    for (let i = gameState.bombs.length - 1; i >= 0; i--) {
        const bomb = gameState.bombs[i];
        bomb.position.y += gameState.bombSpeed;
        
        // Remove bombs that are off screen
        if (bomb.position.y > window.innerHeight/2) {
            scene.remove(bomb);
            gameState.bombs.splice(i, 1);
        }
    }
    
    // Update items
    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];
        item.position.y -= gameState.scrollSpeed;
        item.rotation.z += 0.02; // Rotate item for visual effect
        
        // Check collision with player
        if (checkCollision(player, item)) {
            if (item.itemType === 'heart') {
                if (gameState.health < gameState.maxHealth) {
                    gameState.health++;
                    updateHeartDisplay();
                }
            } else {
                applyPowerUp(item.itemType);
            }
            scene.remove(item);
            gameState.items.splice(i, 1);
            continue;
        }
        
        // Remove items that are off screen
        if (item.position.y < -window.innerHeight/2) {
            scene.remove(item);
            gameState.items.splice(i, 1);
        }
    }
    
    // Update bullets with enhanced speed
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.position.y += gameState.bulletSpeed * gameState.bulletSpeedMultiplier;
        
        // Remove bullets that are off screen
        if (bullet.position.y > window.innerHeight/2) {
            scene.remove(bullet);
            gameState.bullets.splice(i, 1);
        }
    }
    
    // Spawn new elements
    spawnGroundElements();
    spawnTanks();
    spawnItems();
    
    // Spawn enemies
    const now = Date.now();
    if (now - gameState.lastEnemySpawn > gameState.enemySpawnInterval) {
        const enemy = createEnemy();
        scene.add(enemy);
        gameState.enemies.push(enemy);
        gameState.lastEnemySpawn = now;
    }
    
    // Update enemies with type-specific behavior
    updateEnemies();
}

// Collision detection
function checkCollision(obj1, obj2) {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 20; // Collision threshold
}

// Score display
const scoreElement = document.createElement('div');
scoreElement.style.position = 'fixed';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(scoreElement);

function updateScore() {
    scoreElement.textContent = `Score: ${gameState.score}`;
}
updateScore();

// Create heart display
const heartDisplay = document.createElement('div');
heartDisplay.style.position = 'fixed';
heartDisplay.style.top = '60px';
heartDisplay.style.left = '20px';
heartDisplay.style.color = 'red';
heartDisplay.style.fontSize = '32px';
heartDisplay.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(heartDisplay);

function updateHeartDisplay() {
    heartDisplay.textContent = '❤'.repeat(gameState.health);
}
updateHeartDisplay();

// Resize handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
});

// Animation loop
function animate() {
    gameState.animationFrame = requestAnimationFrame(animate);
    updatePlayer();
    updateGameObjects();
    
    // Add console log to verify game loop is running
    console.log('Rendering frame, player position:', player.position);
    
    renderer.render(scene, camera);
}

animate();

// Add damage handling function
function handleDamage() {
    if (gameState.invulnerable) return;
    
    gameState.health--;
    updateHeartDisplay();
    
    // Game over if health reaches 0
    if (gameState.health <= 0) {
        handleGameOver();
        return;
    }
    
    // Set invulnerability
    gameState.invulnerable = true;
    gameState.lastHitTime = Date.now();
    
    // Visual feedback for damage
    const blinkInterval = setInterval(() => {
        player.visible = !player.visible;
    }, 200);
    
    // Remove invulnerability after duration
    setTimeout(() => {
        gameState.invulnerable = false;
        player.visible = true;
        clearInterval(blinkInterval);
    }, gameState.invulnerabilityDuration);
}

// Add game over handling
function handleGameOver() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.style.position = 'fixed';
    gameOverScreen.style.top = '50%';
    gameOverScreen.style.left = '50%';
    gameOverScreen.style.transform = 'translate(-50%, -50%)';
    gameOverScreen.style.color = 'white';
    gameOverScreen.style.fontSize = '48px';
    gameOverScreen.style.fontFamily = 'Arial, sans-serif';
    gameOverScreen.style.textAlign = 'center';
    gameOverScreen.innerHTML = `Game Over<br>Score: ${gameState.score}<br>Click to Restart`;
    document.body.appendChild(gameOverScreen);
    
    // Stop game loop
    cancelAnimationFrame(gameState.animationFrame);
    
    // Add restart handler
    document.addEventListener('click', () => {
        location.reload();
    }, { once: true });
}

// Create power-up item
function createItem(x, y, type) {
    const group = new THREE.Group();
    
    // Base item shape (circle)
    const baseGeometry = new THREE.CircleGeometry(8, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFD700, // Gold color for all items
        side: THREE.DoubleSide,
        shininess: 50
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);
    
    // Add type-specific symbol
    const symbolGeometry = new THREE.ShapeGeometry(createSymbolShape(type));
    const symbolMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000, // Black color for symbol
        side: THREE.DoubleSide
    });
    const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
    symbol.position.z = 0.1; // Slightly in front of base
    group.add(symbol);
    
    group.position.set(x, y, 0);
    group.itemType = type;
    
    return group;
}

// Helper function to create symbol shapes for items
function createSymbolShape(type) {
    const shape = new THREE.Shape();
    
    switch(type) {
        case 'size':
            // 'S' symbol
            shape.moveTo(-3, 4);
            shape.bezierCurveTo(-1, 4, 1, 4, 3, 3);
            shape.bezierCurveTo(1, 2, -1, 1, -2, 0);
            shape.bezierCurveTo(-1, -1, 1, -2, 3, -3);
            shape.bezierCurveTo(1, -4, -1, -4, -3, -4);
            break;
            
        case 'count':
            // '+' symbol
            shape.moveTo(-3, 0);
            shape.lineTo(3, 0);
            shape.moveTo(0, -3);
            shape.lineTo(0, 3);
            break;
            
        case 'speed':
            // '>' symbol
            shape.moveTo(-3, 3);
            shape.lineTo(3, 0);
            shape.lineTo(-3, -3);
            break;
            
        case 'heart':
            // Heart symbol
            shape.moveTo(0, -3);
            shape.bezierCurveTo(-3, 0, -3, 3, 0, 3);
            shape.bezierCurveTo(3, 3, 3, 0, 0, -3);
            break;
    }
    
    return shape;
} 