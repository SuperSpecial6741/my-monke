const hubView = document.getElementById('hubView');
const playerView = document.getElementById('playerView');
const cards = document.querySelectorAll('.game-card');
const panicScreen = document.getElementById('panicScreen');
const canvas = document.getElementById('obbyCanvas');
const ctx = canvas.getContext('2d');

let animationId, gameActive, pX, pY, pZ, pSpeed, pYSpeed, trackSegments, finishZ, levelTheme, levelWalls;
let currentLevel = 1, maxLevels = 20;
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
    gameActive = true; pX = pY = pZ = pSpeed = pYSpeed = 0; finishZ = 500;
    
    let themes = [
        { sky: "#87CEEB", road: "#3e4144", name: "Training Base" },
        { sky: "#ffb74d", road: "#5d4037", name: "Canyon Gaps" },
        { sky: "#37474f", road: "#1a1a1a", name: "Industrial Speed" },
        { sky: "#1a0033", road: "#001122", name: "Monke Matrix" }
    ];
    levelTheme = themes[Math.min(3, Math.floor((level - 1) / 5))];

    trackSegments = []; levelWalls = [];
    for (let z = 0; z <= finishZ + 40; z += 10) {
        let type = "road";
        if (level <= 4 && (z === 120 || z === 280)) type = "ramp";
        if (level > 4 && level <= 8) {
            if (z === 100 || z === 240) type = "ramp";
            if ((z > 110 && z < 140) || (z > 250 && z < 280)) type = "pit";
        }
        if (level > 8 && level <= 12) {
            if (z === 80 || z === 200) type = "ramp";
            if (z > 90 && z < 110) type = "pit";
            if (z === 150) levelWalls.push({ x: -3, z: z, w: 6, h: 4, col: "#e64a19" });
            if (z === 250) levelWalls.push({ x: 3, z: z, w: 6, h: 4, col: "#e64a19" });
        }
        if (level > 12 && level <= 16) {
            if (z === 100 || z === 250) type = "boost";
            if (z === 120 || z === 270) type = "ramp";
            if (z > 130 && z < 170) type = "pit";
        }
        if (level > 16) {
            if (z === 60 || z === 180) type = "boost";
            if (z === 70 || z === 200) type = "ramp";
            if (z > 80 && z < 120) type = "pit";
            if (z === 150) levelWalls.push({ x: -4, z: z, w: 7, h: 5, col: "#00ffcc" });
        }
        if (z === 410 || z === 420) type = "boost";
        if (z >= 430 && z <= 470 && level > 4) type = "loop";
        trackSegments.push({ z: z, type: type });
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    ctx.textAlign = "left";
    gameLoop();
}

function handleKeyDown(e) { if (e.key in keys) keys[e.key] = true; if (e.key === 'Escape') activatePanicButton(); }
function handleKeyUp(e) { if (e.key in keys) keys[e.key] = false; }

function renderRealistic3DBlock(x, yOffset, z, width, height, color, type = "road") {
    let relativeZ = z - pZ; if (relativeZ <= -20) return;
    let targetZ = relativeZ + 12; if (targetZ <= 1) return;
    let scale = 350 / targetZ;
    let screenX = (canvas.width / 2) + (x - pX) * scale;
    let screenY = (canvas.height / 2) + (3.5 + yOffset - pY) * scale;
    let w = width * scale, h = height * scale;

    if (type === "pit") return;
    if (type === "ramp") {
        ctx.fillStyle = "#ff5722"; ctx.beginPath(); ctx.moveTo(screenX - w/2, screenY);
        ctx.lineTo(screenX + w/2, screenY); ctx.lineTo(screenX, screenY - h * 2.5);
        ctx.closePath(); ctx.fill(); return;
    }
    if (type === "boost") {
        ctx.fillStyle = "#00b0ff"; ctx.fillRect(screenX - w / 2, screenY - h, w, h);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center";
        ctx.fillText("⚡ NITRO ⚡", screenX, screenY - h/3); ctx.textAlign = "left"; return;
    }
    if (type === "loop") {
        ctx.fillStyle = "rgba(0, 116, 217, 0.35)"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(screenX, screenY - scale * 3.5, scale * 4.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke(); return;
    }
    ctx.fillStyle = color; ctx.fillRect(screenX - w / 2, screenY - h, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.strokeRect(screenX - w / 2, screenY - h, w, h);
}

function gameLoop() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(gameLoop);

    if (keys.w || keys.ArrowUp) pSpeed += 0.22;
    if (keys.s || keys.ArrowDown) pSpeed -= 0.15;
    if (keys.a || keys.ArrowLeft) pX -= 0.20;
    if (keys.d || keys.ArrowRight) pX += 0.20;
    pSpeed *= 0.94; pZ += pSpeed;

    let seg = trackSegments[Math.floor(pZ / 10)] || { type: "road" };
    if (pY > 0 || seg.type === "pit") {
        pYSpeed -= 0.12; pY += pYSpeed;
        if (pY < 0 && seg.type !== "pit") { pY = 0; pYSpeed = 0; }
        if (pY < -12) { gameActive = false; renderScreenOverlay("WASTED! 💥", `Fell into the void on Level ${currentLevel}!`, "#ff3333", true); return; }
    }
    if (seg.type === "ramp" && pY <= 0) { pYSpeed = 2.8 + (pSpeed * 0.35); pY += pYSpeed; }
    if (seg.type === "boost") pSpeed += 0.42;
    if (seg.type === "loop") {
        if (pSpeed < 4.2) { pY = pSpeed = pYSpeed = 0; gameActive = false; renderScreenOverlay("CRASHED!", "Stalled inside the loop!", "#ff3333", true); return; }
        pY = Math.abs(Math.sin(pZ * 0.12)) * 8;
    }
    if (Math.abs(pX) > 8.5 && pY <= 0.1) { gameActive = false; renderScreenOverlay("GAME OVER", `Fell off on Level ${currentLevel}!`, "#ff3333", true); return; }

    ctx.fillStyle = levelTheme.sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
    trackSegments.forEach(s => { if (s.z - pZ <= 240 && s.z - pZ >= -40) renderRealistic3DBlock(0, 0, s.z, 16, 0.4, levelTheme.road, s.type); });
    levelWalls.forEach(w => {
        renderRealistic3DBlock(w.x, -0.4, w.z, w.w, w.h, w.col);
        if (Math.abs(pZ - w.z) < 5 && Math.abs(pX - w.x) < (w.w / 2 + 1.2) && pY < w.h - 1) {
            gameActive = false; renderScreenOverlay("SMASHED! 💥", "Wrecked into a wall barrier!", "#ff3333", true);
        }
    });
    renderRealistic3DBlock(0, -0.1, finishZ, 16, 0.6, "#00ff66");

    let scale = 350 / 12, tX = canvas.width / 2, tY = (canvas.height / 2) + 3.9 * scale;
    ctx.save();
    if (seg.type === "loop") { ctx.translate(tX, tY - 30); ctx.rotate(pZ * 0.12); ctx.translate(-tX, -(tY - 30)); }
    ctx.fillStyle = "#ffcc00"; ctx.fillRect(tX - 25, tY - 45, 50, 25);
    ctx.fillStyle = "#cca600"; ctx.fillRect(tX - 25, tY - 20, 50, 8);
    ctx.fillStyle = "#111111"; ctx.fillRect(tX - 18, tY - 65, 36, 20);
    ctx.fillStyle = "#ffcc00"; ctx.fillRect(tX - 20, tY - 68, 40, 4);
    ctx.fillStyle = "#1e1e1e"; ctx.fillRect(tX - 34, tY - 25, 12, 26); ctx.fillRect(tX + 22, tY - 25, 12, 26);
    ctx.fillStyle = "#b0bec5"; ctx.fillRect(tX - 32, tY - 16, 8, 8); ctx.fillRect(tX + 24, tY - 16, 8, 8);
    ctx.restore();

    if (pZ >= finishZ) {
        gameActive = false; monkeBucks += 50; localStorage.setItem('monkeBucks', monkeBucks); updateWalletDisplay();
        if (currentLevel < maxLevels) {
            renderScreenOverlay("STAGE CLEARED! 🏁", "Earned +50 MB! Next track loading...", "#00ff66", false);
            currentLevel += 1; setTimeout(() => { setupLevel(currentLevel); }, 2200);
        } else {
            renderScreenOverlay("OBBY CHAMPION! 👑", `All 20 Stages Cleared! Wallet: ${monkeBucks} MB`, "#ffd700", true);
            currentLevel = 1;
        }
        return;
    }
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Courier New";
    ctx.fillText(`OBBY ZONE: ${levelTheme.name}`, 45, 40);
    ctx.fillText(`PROGRESS : Stage ${currentLevel} / ${maxLevels}`, 45, 65);
    ctx.fillText(`VELOCITY : ${Math.floor(Math.abs(pSpeed) * 38)} MPH`, 45, 90);
    ctx.fillText(`ALTITUDE : ${Math.floor(pY * 5)} FT`, 45, 115);
}

function renderScreenOverlay(title, msg, col, showRestartText) {
    ctx.fillStyle = "rgba(15, 17, 19, 0.92)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = col; ctx.font = "bold 45px Arial"; ctx.textAlign = "center"; ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = "#ffffff"; ctx.font = "18px Arial"; ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 20);
    if (showRestartText) { ctx.fillStyle = "#00b0ff"; ctx.fillText("Press 'Exit Game' and click card to restart this stage!", canvas.width / 2, canvas.height / 2 + 65); }
    ctx.textAlign = "left";
}

function closeGameFrame() { gameActive = false; cancelAnimationFrame(animationId); window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); playerView.style.display = 'none'; hubView.style.display = 'block'; }
function activatePanicButton() { closeGameFrame(); panicScreen.style.display = 'block'; document.title = "Google Docs - Working Assignment Document"; }
function deactivatePanicButton() { panicScreen.style.display = 'none'; document.title = "MONKE PLATFORM - Play & Explore"; }
