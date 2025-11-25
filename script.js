// --- KONSTANTE ZA HITROST IN TOČKOVANJE ---
const INITIAL_SPEED_MS = 300; // Počasen začetek
const SPEED_INCREMENT_MS = 10; // Za toliko se bo interval zmanjšal na vsakih 10 točk
const SCORE_PER_FOOD = 1;      // Vsaka hrana prinese 1 točko

// --- KONSTANTE ZA STIL ---
const TILE_SIZE = 60; 

// Vizualno povečanje glave in hrane brez vpliva na logiko
const ENLARGED_HEAD_FACTOR = 1.1; 
const ENLARGED_FOOD_FACTOR = 1.1; 

const BODY_WIDTH = TILE_SIZE * 0.95; 
const BODY_COLOR = '#FFD700'; 
const BODY_STROKE_COLOR = '#000000'; 
const BODY_STROKE_WIDTH = 0.5; // Tanka zunanja obroba

// Konstante za simulacijo "reliefa"
const RELIEF_MARKER_RADIUS = TILE_SIZE * 0.45; 
const RELIEF_MARKER_COLOR = '#FFD700'; 
const RELIEF_MARKER_STROKE_COLOR = '#000000'; 
const RELIEF_MARKER_STROKE_WIDTH = 1.5; 
const INTERPOLATION_STEPS = 6; // Gostota reliefnih oznak


// --- SPLOŠNE KONSTANTE IN INICIALIZACIJA ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverMessage = document.getElementById('game-over-message');

let TILE_COUNT;
let gameLoopInterval;
let isPaused = false;
let score = 0;
let imagesLoadedCount = 0;

// --- STANJE IGRE ---
let snake;
let velocity;
let food = []; // Hrana je sedaj polje


// --- SLIKE IN NALAGANJE ---
const headImage = new Image();
const foodImagesSrc = [
    'ramen.png', 
    'friedchic.png',
    'kimchi.png',
    'rice.png'
];
const loadedFoodImages = [];
const totalImages = 1 + foodImagesSrc.length;

function imageLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === totalImages) {
        resetGame();
    }
}

headImage.onload = imageLoaded;
headImage.src = 'toni.png';

foodImagesSrc.forEach(src => {
    const img = new Image();
    img.onload = imageLoaded;
    img.src = src;
    loadedFoodImages.push(img);
});


// --- FUNKCIJE ZA PRIPRAVO IN HITROST ---

// CELOZASLONSKI NAČIN
function resizeCanvas() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Prilagoditev na velikost okna
    let size = Math.min(width - 50, height - 150); 
    
    // Zagotovi, da je velikost deljiva s TILE_SIZE
    size = Math.floor(size / TILE_SIZE) * TILE_SIZE;
    
    canvas.width = size;
    canvas.height = size;
    
    TILE_COUNT = size / TILE_SIZE;
}

function adjustSpeed() {
    // Dinamično pospeševanje nad 10 točk
    if (score >= 10) {
        const speedLevel = Math.floor((score - 10) / 10) + 1; 
        
        const newInterval = Math.max(
            INITIAL_SPEED_MS - (speedLevel * SPEED_INCREMENT_MS), 
            50 // Minimalna hitrost 50 ms
        );
        
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, newInterval);
    }
}

function resetGame() {
    resizeCanvas();

    snake = [
        { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) }
    ];
    
    velocity = { x: 1, y: 0 };
    score = 0;
    isPaused = false;
    scoreDisplay.textContent = `Točke: ${score}`;
    gameOverMessage.classList.add('hidden');

    placeFood();

    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, INITIAL_SPEED_MS); 
}

function placeFood() {
    food = []; 

    for (let i = 0; i < 2; i++) {
        let newFoodPosition;
        do {
            newFoodPosition = { 
                x: Math.floor(Math.random() * TILE_COUNT), 
                y: Math.floor(Math.random() * TILE_COUNT) 
            };
        } while (
            snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y) ||
            food.some(existingFood => existingFood.x === newFoodPosition.x && existingFood.y === newFoodPosition.y)
        );
        
        const foodImageIndex = Math.floor(Math.random() * loadedFoodImages.length);

        food.push({ 
            ...newFoodPosition, 
            image: loadedFoodImages[foodImageIndex] 
        });
    }
}


// --- GLAVNA ZANKA IGRE (GAME LOOP) ---

function gameLoop() {
    if (isPaused) return;

    const newHead = { 
        x: snake[0].x + velocity.x, 
        y: snake[0].y + velocity.y 
    };

    if (checkCollision(newHead)) {
        endGame();
        return;
    }

    snake.unshift(newHead);

    const foodIndex = food.findIndex(f => f.x === newHead.x && f.y === newHead.y);

    if (foodIndex !== -1) { 
        score += SCORE_PER_FOOD; 
        scoreDisplay.textContent = `Točke: ${score}`;
        
        food.splice(foodIndex, 1);

        if (food.length < 2) {
            placeFood();
        }
        
        adjustSpeed(); 
        // Kača raste za SAMO 1 segment (zaradi unshift)
        
    } else {
        snake.pop();
    }

    draw();
}

function checkCollision(head) {
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

function endGame() {
    isPaused = true;
    clearInterval(gameLoopInterval);
    gameOverMessage.classList.remove('hidden');
}


// --- FUNKCIJE ZA RISANJE ---

function draw() {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // KLJUČNO ZA TRANSPARENTNOST PNG slik
    ctx.globalCompositeOperation = 'source-over'; 

    // Nariši hrano (povečana slika)
    food.forEach(f => {
        if (f.image.complete) {
            let enlargedFoodSize = TILE_SIZE * ENLARGED_FOOD_FACTOR;
            let offsetX = (enlargedFoodSize - TILE_SIZE) / 2;
            let offsetY = (enlargedFoodSize - TILE_SIZE) / 2;

            ctx.drawImage(f.image, 
                          f.x * TILE_SIZE - offsetX, 
                          f.y * TILE_SIZE - offsetY, 
                          enlargedFoodSize, enlargedFoodSize);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(f.x * TILE_SIZE, f.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    });
    
    // Nariši kačo (začetek reliefne poti)
    if (snake.length === 0) return;

    // 1. Nariši celotno črno obrobo telesa
    ctx.beginPath();
    ctx.moveTo(snake[0].x * TILE_SIZE + TILE_SIZE / 2, snake[0].y * TILE_SIZE + TILE_SIZE / 2);

    for (let i = 1; i < snake.length; i++) {
        for (let j = 0; j <= INTERPOLATION_STEPS; j++) {
            const factor = j / INTERPOLATION_STEPS;
            const x1 = snake[i-1].x * TILE_SIZE + TILE_SIZE / 2;
            const y1 = snake[i-1].y * TILE_SIZE + TILE_SIZE / 2;
            const x2 = snake[i].x * TILE_SIZE + TILE_SIZE / 2;
            const y2 = snake[i].y * TILE_SIZE + TILE_SIZE / 2;

            const interpolatedX = x1 + (x2 - x1) * factor;
            const interpolatedY = y1 + (y2 - y1) * factor;
            ctx.lineTo(interpolatedX, interpolatedY);
        }
    }
    
    ctx.lineCap = 'round'; 
    ctx.lineJoin = 'round'; 
    ctx.lineWidth = BODY_WIDTH + BODY_STROKE_WIDTH * 2; 
    ctx.strokeStyle = BODY_STROKE_COLOR; 
    ctx.stroke();

    // 2. Risanje reliefnih oznak (zapolnjenih krogov) za relief
    for (let i = 1; i < snake.length; i++) {
        for (let j = 0; j < INTERPOLATION_STEPS; j++) {
            const factor = j / INTERPOLATION_STEPS;
            const x1 = snake[i-1].x * TILE_SIZE + TILE_SIZE / 2;
            const y1 = snake[i-1].y * TILE_SIZE + TILE_SIZE / 2;
            const x2 = snake[i].x * TILE_SIZE + TILE_SIZE / 2;
            const y2 = snake[i].y * TILE_SIZE + TILE_SIZE / 2;

            const interpolatedX = x1 + (x2 - x1) * factor;
            const interpolatedY = y1 + (y2 - y1) * factor;

            ctx.beginPath();
            ctx.arc(interpolatedX, interpolatedY, RELIEF_MARKER_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = RELIEF_MARKER_COLOR; 
            ctx.fill();
            ctx.strokeStyle = RELIEF_MARKER_STROKE_COLOR; 
            ctx.lineWidth = RELIEF_MARKER_STROKE_WIDTH;
            ctx.stroke();
        }
    }

    // 3. Risanje glave na vrhu (povečana slika)
    if (headImage.complete) { 
        let enlargedHeadSize = TILE_SIZE * ENLARGED_HEAD_FACTOR;
        let offsetX = (enlargedHeadSize - TILE_SIZE) / 2;
        let offsetY = (enlargedHeadSize - TILE_SIZE) / 2;

        ctx.drawImage(headImage, 
                      snake[0].x * TILE_SIZE - offsetX, 
                      snake[0].y * TILE_SIZE - offsetY, 
                      enlargedHeadSize, enlargedHeadSize);
    } else {
        ctx.fillStyle = '#00f080';
        ctx.fillRect(snake[0].x * TILE_SIZE, snake[0].y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}


// --- KONTROLE IN ZAGON ---

window.addEventListener('resize', resetGame);

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (velocity.y === 0) velocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
            if (velocity.y === 0) velocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
            if (velocity.x === 0) velocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
            if (velocity.x === 0) velocity = { x: 1, y: 0 };
            break;
        case ' ':
            if (isPaused) resetGame();
            break;
    }
});

document.getElementById('mobile-controls').addEventListener('click', (e) => {
    const direction = e.target.getAttribute('data-direction');
    if (!direction) return;

    if (isPaused) {
        resetGame();
        return;
    }

    switch (direction) {
        case 'UP':
            if (velocity.y === 0) velocity = { x: 0, y: -1 };
            break;
        case 'DOWN':
            if (velocity.y === 0) velocity = { x: 0, y: 1 };
            break;
        case 'LEFT':
            if (velocity.x === 0) velocity = { x: -1, y: 0 };
            break;
        case 'RIGHT':
            if (velocity.x === 0) velocity = { x: 1, y: 0 };
            break;
    }
});

document.getElementById('gameCanvas').addEventListener('click', () => {
    if (isPaused) resetGame();
});

// Zagon igre po nalaganju slik
if (imagesLoadedCount === totalImages) {
    resetGame();
}