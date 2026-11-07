// BOX 1: PASTE THIS WHOLE FILE INTO game.js
const hubView = document.getElementById('hubView');
const playerView = document.getElementById('playerView');
const searchInput = document.getElementById('platformSearch');
const cards = document.querySelectorAll('.game-card');
const panicScreen = document.getElementById('panicScreen');

const canvas = document.getElementById('obbyCanvas');
const ctx = canvas.getContext('2d');

let animationId, gameActive, pX, pZ, pSpeed, obstacles, finishZ;
let keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

function launchInternalGame() {
    hubView.style.display = 'none';
    playerView.style.display = 'block';
    
    gameActive = true;
    pX = 0;
    pZ = 0;
    pSpeed = 0;
    finishZ = 400; 
    
    obstacles = [
        { x: -3, z: 60, rot: 0, speed: 0.04 },
        { x: 2, z: 120, rot: 1, speed: 0.06 },
        { x: -1, z: 180, rot: 2, speed: 0.03 },
        { x: 3, z: 240, rot: 0, speed: 0.07 },
        { x: -2, z: 300, rot: 1.5, speed: 0.05 },
        { x: 0, z: 350, rot: 3, speed: 0.08 }
    ];

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();
}

function handleKeyDown(e) {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === 'Escape') activatePanicButton();
}

function handleKeyUp(e) {
    if (e.key in keys) keys[e.key] = false;
}

function render3DBlock(x, z, width, height, length, color) {
    let relativeZ = z - pZ;
    if (relativeZ <= 5) return; 

    let scale = 300 / relativeZ; 
    let screenX = (canvas.width / 2) + (x - pX) * scale;
    let screenY = (canvas.height / 2) + (2) * scale; 

    let w = width * scale;
    let h = height * scale;

    ctx.fillStyle = color;
    ctx.fillRect(screenX - w / 2, screenY - h, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - w / 2, screenY - h, w, h);
}

function gameLoop() {
    if (!gameActive) return;
    animationId = requestAnimationFrame(gameLoop);

    if (keys.w || keys.ArrowUp) pSpeed += 0.2;
    if (keys.s || keys.ArrowDown) pSpeed -= 0.15;
    if (keys.a || keys.ArrowLeft) pX -= 0.18;
    if (keys.d || keys.ArrowRight) pX += 0.18;

    pSpeed *= 0.93; 
    pZ += pSpeed;

    if (Math.abs(pX) > 8) {
        gameActive = false;
        renderScreenOverlay("GAME OVER", "You fell off the floating Obby path!", "#ff3333");
        return;
    }

    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let z = 0; z < finishZ + 60; z += 20) {
        let color = (Math.floor(z / 20) % 2 === 0) ? "#444444" : "#555555";
        render3DBlock(0, z, 16, 0.5, 20, color);
    }

    render3DBlock(0, finishZ, 16, 0.8, 10, "#00ff66");

    if (pZ >= finishZ) {
        gameActive = false;
        renderScreenOverlay("VICTORY!", "You finished the Yellow Truck Obby!", "#00ff66");
        return;
    }

    obstacles.forEach(obs => {
        obs.rot += obs.speed;
        let dynamicX = obs.x + Math.sin(obs.rot) * 4.5; 
        render3DBlock(dynamicX, obs.z, 3.5, 3.5, 3.5, "#ff3333");

        if (Math.abs(pZ - obs.z) < 4 && Math.abs(pX - dynamicX) < 2.5) {
            gameActive = false;
            renderScreenOverlay("CRASHED!", "Watch out for the rotating obstacles!", "#ff3333");
        }
    });

    ctx.fillStyle = "#ffcc00"; 
    ctx.fillRect(280, 350, 240, 100);
    ctx.fillStyle = "#111111"; 
    ctx.fillRect(310, 290, 180, 60);
    ctx.fillStyle = "#ffd54f"; 
    ctx.fillRect(330, 370, 140, 15);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Obby Progress: " + Math.min(100, Math.floor((pZ / finishZ) * 100)) + "%", 40, 40);
}

function renderScreenOverlay(title, msg, col) {
    ctx.fillStyle = "rgba(25, 27, 29, 0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = col;
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = "#00b0ff";
    ctx.fillText("Press 'Exit Game' and click card to reload!", canvas.width / 2, canvas.height / 2 + 65);
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
