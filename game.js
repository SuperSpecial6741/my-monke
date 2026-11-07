const hubView = document.getElementById('hubView');
const playerView = document.getElementById('playerView');
const cards = document.querySelectorAll('.game-card');
const panicScreen = document.getElementById('panicScreen');

const canvas = document.getElementById('obbyCanvas');
const ctx = canvas.getContext('2d');

let animationId, gameActive, pX, pY, pZ, pSpeed, pYSpeed, trackSegments, finishZ, levelTheme;
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
    pY = 0; 
    pZ = 0;
    pSpeed = 0;
    pYSpeed = 0; 
    finishZ = 500; 
    
    if (level <= 5) {
        levelTheme = { sky: "#87CEEB", road: "#3e4144", stripes: "#ffffff", name: "Stunt Beginner" };
    } else if (level <= 10) {
        levelTheme = { sky: "#ffb74d", road: "#5d4037", stripes: "#ffd54f", name: "Canyon Jumper" };
    } else if (level <= 15) {
        levelTheme = { sky: "#37474f", road: "#1a1a1a", stripes: "#ff3333", name: "Lava Pit Arena" };
    } else {
        levelTheme = { sky: "#1a0033", road: "#001122", stripes: "#00ffcc", name: "Hyperspace Loop" };
    }

    trackSegments = [];
    for (let z = 0; z <= finishZ + 40; z += 10) {
        let type = "road"; 

        if (z > 80 && z < 110) {
            type = (level > 2) ? "pit" : "road"; 
        } else if (z === 70 || z === 150 || z === 260) {
            type = "ramp"; 
        } else if (z >= 180 && z <= 220 && level > 5) {
            type = "pit"; 
        } else if (z >= 320 && z <= 360) {
            type = "loop"; 
        }

        trackSegments.push({ z: z, type: type });
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

function renderRealistic3DBlock(x, yOffset, z, width, height, color, type = "road") {
    let relativeZ = z - pZ;
    if (relativeZ <= -20) return; 

    let camHeightOffset = 3.5;
    let camBackDistance = -12;
    let targetZ = relativeZ - camBackDistance;
    if (targetZ <= 1) return;

    let scale = 350 / targetZ; 
    let screenX = (canvas.width / 2) + (x - pX) * scale;
    let screenY = (canvas.height / 2) + (camHeightOffset + yOffset - pY) * scale; 

    let w = width * scale;
    let h = height * scale;

    if (type === "pit") return; 

    if (type === "ramp") {
        ctx.fillStyle = "#ff5722";
        ctx.beginPath();
        ctx.moveTo(screenX - w/2, screenY);
        ctx.lineTo(screenX + w/2, screenY);
        ctx.lineTo(screenX, screenY - h * 2.5);
        ctx.closePath();
        ctx.fill();
        return;
    }

    if (type === "loop") {
        ctx.fillStyle = "rgba(0, 116, 217, 0.4)";
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY - scale * 3.5, scale * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        return;
    }

    ctx.fillStyle = color;
    ctx.fillRect(screenX - w / 2, screenY - h, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.strokeRect(screenX - w / 2, screenY - h, w, h);
}

function gameLoop() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(gameLoop);

    if (keys.w || keys.ArrowUp) pSpeed += 0.22;
    if (keys.s || keys.ArrowDown) pSpeed -= 0.15;
    if (keys.a || keys.ArrowLeft) pX -= 0.20;
    if (keys.d || keys.ArrowRight) pX += 0.20;

    pSpeed *= 0.94; 
    pZ += pSpeed;

    let currentSegmentIndex = Math.floor(pZ / 10);
    let currentSeg = trackSegments[currentSegmentIndex] || { type: "road" };

    if (pY > 0 || currentSeg.type === "pit") {
        pYSpeed -= 0.12; 
        pY += pYSpeed;

        if (pY < -12) {
            gameActive = false;
            renderScreenOverlay("WASTED! 💥", "You plunged straight into the void pit!", "#ff3333", true);
            return;
        }
    }

    if (currentSeg.type === "ramp" && pY <= 0) {
        pYSpeed = 2.8 + (pSpeed * 0.35); 
        pY += pYSpeed;
    }

    if (currentSeg.type === "loop") {
        if (pSpeed < 3.5) {
            gameActive = false;
            renderScreenOverlay("CRASHED!", "Not enough momentum to scale the loop-de-loop!", "#ff3333", true);
            return;
        }
        pY = Math.abs(Math.sin(pZ * 0.12)) * 8;
    }

    if (pY < 0 && currentSeg.type !== "pit") {
        pY = 0;
        pYSpeed = 0;
    }

    if (Math.abs(pX) > 8.5 && pY <= 0.1) {
        gameActive = false;
        renderScreenOverlay("GAME OVER", `Clipped the guardrails on Stage ${currentLevel}!`, "#ff3333", true);
        return;
    }

    ctx.fillStyle = levelTheme.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    trackSegments.forEach(seg => {
        if (seg.z - pZ > 240 || seg.z - pZ < -40) return; 
        renderRealistic3DBlock(0, 0, seg.z, 16, 0.4, levelTheme.road, seg.type);
    });

    renderRealistic3DBlock(0, -0.1, finishZ, 16, 0.6, "#00ff66");

    let truckScale = 350 / 12; 
    let tX = canvas.width / 2;
    let tY = (canvas.height / 2) + (3.5 + 0.4) * truckScale; 

    ctx.save();
    if (currentSeg.type === "loop") {
        ctx.translate(tX, tY - 30);
        ctx.rotate(pZ * 0.12);
        ctx.translate(-tX, -(tY - 30));
    }

    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(tX - 25, tY - 45, 50, 25);
    ctx.fillStyle = "#cca600"; 
    ctx.fillRect(tX - 25, tY - 20, 50, 8);
    
    ctx.fillStyle = "#111111"; 
    ctx.fillRect(tX - 18, tY - 65, 36, 20);
    ctx.fillStyle = "#ffcc00"; 
    ctx.fillRect(tX - 20, tY - 68, 40, 4);

    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(tX - 34, tY - 25, 12, 26); 
    ctx.fillRect(tX + 22, tY - 25, 12, 26); 

    ctx.fillStyle = "#b0bec5";
    ctx.fillRect(tX - 32, tY - 16, 8, 8);
    ctx.fillRect(tX + 24, tY - 16, 8, 8);
    ctx.restore();

    if (pZ >= finishZ) {
        gameActive = false;
        monkeBucks += 50; 
        localStorage.setItem('monkeBucks', monkeBucks);
        updateWalletDisplay();

        if (currentLevel < maxLevels) {
            renderScreenOverlay("STUNT COMPLETED! 🏁", `Earned +50 MB! Next track loading...`, "#00ff66", false);
            currentLevel += 1;
            setTimeout(() => { setupLevel(currentLevel); }, 2200);
        } else {
            renderScreenOverlay("OBBY CHAMPION! 👑", `20-Stage Gauntlet Beat! Final Balance: ${monkeBucks} MB`, "#ffd700", true);
            currentLevel = 1; 
        }
        return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Courier New";
    ctx.fillText(`OBBY AREA: ${levelTheme.name}`, 45, 40);
    ctx.fillText(`COURSE   : Stage ${currentLevel} / ${maxLevels}`, 45, 65);
    ctx.fillText(`VELOCITY : ${Math.floor(Math.abs(pSpeed) * 38)} MPH`, 45, 90);
    ctx.fillText(`ALTITUDE : ${Math.floor(pY * 5)} FT`, 45, 115);
}

function renderScreenOverlay(title, msg, col, showRestartText) {
    ctx.fillStyle = "rgba(15, 17, 19, 0.92)";
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
        ctx.fillText("Press 'Exit Game' and click card to restart this stage!", canvas.width / 2, canvas.height / 2 + 65);
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
