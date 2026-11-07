const hubView = document.getElementById('hubView');
const playerView = document.getElementById('playerView');
const searchInput = document.getElementById('platformSearch');
const cards = document.querySelectorAll('.game-card');
const panicScreen = document.getElementById('panicScreen');

const canvas = document.getElementById('obbyCanvas');
const ctx = canvas.getContext('2d');

let animationId, gameActive, pX, pZ, pSpeed, obstacles, finishZ, levelTheme;
let currentLevel = 1;
const maxLevels = 20;

let monkeBucks = parseInt(localStorage.getItem('monkeBucks')) || 0;
updateWalletDisplay();

let keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

function updateWalletDisplay() {
    const userStatusDiv = document.querySelector('.user-status');
    if (userStatusDiv) {
        userStatusDiv.innerHTML = `
            <span id="panicTrigger" onclick="activatePanicButton()" style="color: #00b0ff; cursor: pointer; font-weight: bold; margin-right: 15px;">📘 Docs</span>
            <span style="color: #ffd700; font-weight: bold; margin-right: 15px;">🪙 ${monkeBucks} MB</span>
            <span class="avatar-icon">👤</span>
            <span class="username">Guest_Monke</span>
        `;
    }
}

function launchInternalGame() {
    hubView.style.display = 'none';
    playerView.style.display = 'block';
    setupLevel(currentLevel);
}

function setupLevel(level) {
    gameActive = true;
    pX = 0;
    pZ = 0;
    pSpeed = 0;
    finishZ = 450; 
    
    // Define 4 unique environments across the 20 levels
    if (level <= 5) {
        levelTheme = { sky: "#87CEEB", road: "#3e4144", stripes: "#ffffff", obsColor: "#ff9900", name: "City Streets" };
    } else if (level <= 10) {
        levelTheme = { sky: "#ffcc80", road: "#d7ccc8", stripes: "#8d6e63", obsColor: "#a1887f", name: "Desert Run" };
    } else if (level <= 15) {
        levelTheme = { sky: "#263238", road: "#1a1a1a", stripes: "#ff5722", obsColor: "#d84315", name: "Volcano Hazard" };
    } else {
        levelTheme = { sky: "#0d47a1", road: "#001f3f", stripes: "#0074d9", obsColor: "#00ffea", name: "Space Base" };
    }

    // Generate unique obstacles based on the level number
    obstacles = [];
    let obstacleCount = 5 + Math.floor(level * 0.5);
    for (let i = 0; i < obstacleCount; i++) {
        let typeRand = (i + level) % 3; // Swaps obstacle behaviors cleanly
        obstacles.push({
            x: Math.sin(i * 2) * 4,
            z: 70 + (i * 50),
            size: 3 + (i % 2),
            rot: Math.random() * 5,
            speed: (0.03 + (level * 0.005)),
            type: typeRand // 0 = Static block, 1 = Left-right sweeper, 2 = Pulsing wall
        });
    }

    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    ctx.textAlign = "left";
    gameLoop();
}

function handleKeyDown(e) {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'Escape') activatePanicButton();
}

function handleKeyUp(e) {
    if (e.key in keys) keys[e.key] = false;
}

// Upgraded 3D Projector with height offset support and lighting shading panels
function renderRealistic3DBlock(x, yOffset, z, width, height, length, color, drawStripes = false) {
    let relativeZ = z - pZ;
    if (relativeZ <= 4) return; 

    let scale = 320 / relativeZ; 
    let screenX = (canvas.width / 2) + (x - pX) * scale;
    let screenY = (canvas.height / 2) + (2.5 + yOffset) * scale; 

    let w = width * scale;
    let h = height * scale;

    // Ambient drop shadow simulation underneath objects
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(screenX - w/2, screenY, w, h * 0.1);

    // Front structural face paint
    ctx.fillStyle = color;
    ctx.fillRect(screenX - w / 2, screenY - h, w, h);
    
    // Draw track divider stripes if requested
    if (drawStripes) {
        ctx.fillStyle = levelTheme.stripes;
        ctx.fillRect(screenX - (w * 0.04), screenY - h, w * 0.08, h);
    }

    // Outer grid detailing definitions
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - w / 2, screenY - h, w, h);
}

function gameLoop() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(gameLoop);

    if (keys.w || keys.ArrowUp) pSpeed += 0.22;
    if (keys.s || keys.ArrowDown) pSpeed -= 0.16;
    if (keys.a || keys.ArrowLeft) pX -= 0.2;
    if (keys.d || keys.ArrowRight) pX += 0.2;

    pSpeed *= 0.92; 
    pZ += pSpeed;

    if (Math.abs(pX) > 8.5) {
        gameActive = false;
        renderScreenOverlay("GAME OVER", `Fell off on Level ${currentLevel}!`, "#ff3333", true);
        return;
    }

    // 1. Draw Sky Background
    ctx.fillStyle = levelTheme.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Track segments with center lines
    for (let z = 0; z < finishZ + 80; z += 15) {
        if (z - pZ > 200) continue; // Performance distance view culling
        renderRealistic3DBlock(0, 0, z, 17, 0.4, 15, levelTheme.road, (Math.floor(z/15) % 2 === 0));
    }

    // 3. Draw Green Finish Checkpoint Pad
    renderRealistic3DBlock(0, -0.1, finishZ, 17, 0.6, 12, "#00ff66");

    // 4. Update and Render Unique Obstacles
    obstacles.forEach(obs => {
        obs.rot += obs.speed;
        let finalX = obs.x;
        let finalH = obs.size;

        if (obs.type === 1) {
            // Left-Right moving obstacle pathing
            finalX = obs.x + Math.sin(obs.rot) * 5;
        } else if (obs.type === 2) {
            // Pulsing wall sizing scale mechanics
            finalH = obs.size + Math.abs(Math.sin(obs.rot)) * 3;
        }

        renderRealistic3DBlock(finalX, -0.4, obs.z, obs.size, finalH, obs.size, levelTheme.obsColor);

        // Check for collision hit boxes
        if (Math.abs(pZ - obs.z) < 4.5 && Math.abs(pX - finalX) < (obs.size / 2 + 1.4)) {
            gameActive = false;
            renderScreenOverlay("CRASHED!", `Wrecked on Level ${currentLevel}!`, "#ff3333", true);
        }
    });

    if (pZ >= finishZ) {
        gameActive = false;
        monkeBucks += 50; 
        localStorage.setItem('monkeBucks', monkeBucks);
        updateWalletDisplay();

        if (currentLevel < maxLevels) {
            renderScreenOverlay("LEVEL CLEARED! 🎉", `Earned +50 MonkeBucks! Loading Level ${currentLevel + 1}...`, "#00ff66", false);
            currentLevel += 1;
            setTimeout(() => { setupLevel(currentLevel); }, 2200);
        } else {
            renderScreenOverlay("OBBY MASTER! 🏆", `You beat all 20 Levels! Total Wallet: ${monkeBucks} MB`, "#ffd700", true);
            currentLevel = 1; 
        }
        return;
    }

    // 5. DRAW REALISTIC TRUCK (Cockpit HUD View Dashboard Elements)
    // Draw the yellow truck engine hood sticking out front
    ctx.fillStyle = "#cca600"; // Darker base yellow shade shadow
    ctx.fillRect(240, 360, 320, 90);
    ctx.fillStyle = "#ffcc00"; // Main yellow truck paint hood panel
    ctx.fillRect(260, 370, 280, 80);
    
    // Realistic Truck Front Details (Grill and Black Air Intake)
    ctx.fillStyle = "#222"; 
    ctx.fillRect(320, 395, 160, 30);
    ctx.fillStyle = "#fff"; // Left Headlight
    ctx.fillRect(280, 395, 30, 20);
    ctx.fillStyle = "#fff"; // Right Headlight
    ctx.fillRect(490, 395, 30, 20);

    // Dark interior dash windshield outline rim frame
    ctx.fillStyle = "rgba(17,17,17,0.95)";
    ctx.fillRect(0, 420, canvas.width, 30); // Lower dash panel board
    ctx.fillRect(0, 0, 40, canvas.height);    // Left window column border post
    ctx.fillRect(canvas.width - 40, 0, 40, canvas.height); // Right window column border post

    // Head-Up Display text print panels
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Courier New";
    ctx.fillText(`ZONE: ${levelTheme.name}`, 60, 40);
    ctx.fillText(`STAGE: ${currentLevel} / ${maxLevels}`, 60, 65);
    ctx.fillText("DISTANCE: " + Math.min(100, Math.floor((pZ / finishZ) * 100)) + "%", 60, 90);
}

function renderScreenOverlay(title, msg, col, showRestartText) {
    ctx.fillStyle = "rgba(15, 17, 19, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = col;
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 20);
    
    if (showRestartText) {
        ctx.fillStyle = "#00b0ff";
        ctx.fillText("Press 'Exit Game' and click card to restart this level!", canvas.width / 2, canvas.height / 2 + 65);
    }
    ctx.textAlign = "left"; 
}

function closeGameFrame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    playerView.style.display = 'none';
    hubView.style.display = 'block';
}

function activatePanicButton() {
    closeGameFrame();
    panicScreen.style.display = 'block';
    document.title = "Google Docs - Working Assignment Document";
}

function deactivatePanicButton() {
    panicScreen.style.display = 'none';
    document.title = "MONKE PLATFORM - Play & Explore";
}

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    cards.forEach(card => {
        const title = card.getAttribute('data-title');
        card.style.display = title.includes(query) ? 'block' : 'none';
    });
});
