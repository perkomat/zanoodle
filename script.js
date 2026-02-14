// --- KONSTANTE ZA HITROST IN TOČKOVANJE ---
const INITIAL_SPEED_MS = 500; 
const SPEED_INCREMENT_MS = 40; 
const SCORE_PER_FOOD = 1;      

// --- KONSTANTE ZA HRANO ---
const FOOD_COUNT = 2; // Vedno 2 kosa hrane na polju

// --- KONSTANTE ZA STIL IN VELIKOST ---
const TILE_SIZE = 45; 
const ENLARGED_HEAD_FACTOR = 1; 
const ENLARGED_FOOD_FACTOR = 1; 
const BODY_WIDTH = TILE_SIZE * 0.95; 
const BODY_STROKE_COLOR = '#000000'; 
const BODY_STROKE_WIDTH = 0.5; 
const RELIEF_MARKER_RADIUS = TILE_SIZE * 0.45; 
const RELIEF_MARKER_COLOR = '#FDFD96'; 
const RELIEF_MARKER_STROKE_COLOR = '#000000'; 
const RELIEF_MARKER_STROKE_WIDTH = 1.5; 
const INTERPOLATION_STEPS = 6; 
const SWIPE_THRESHOLD = 20; 

// --- SPLOŠNE KONSTANTE IN INICIALIZACIJA ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display'); // POPRAVLJEN ID
const gameOverMessage = document.getElementById('game-over-message');

let TILE_COUNT_X; 
let TILE_COUNT_Y;
let gameLoopInterval;
let isPaused = false;
let score = 0;
let imagesLoadedCount = 0;
let domContentLoaded = false; 

// --- STANJE IGRE ---
let snake;
let velocity;
let food = []; 


// --- SLIKE IN NALAGANJE ---
const headImage = new Image();
const foodImagesSrc = [
    'friedchicken.png',
	'tatar.png',
	'surovi.png',
	'zan.png',
	'por.png',
	'harmonika.png',
	'chilly.png'
];
const loadedFoodImages = [];
const totalImages = 1 + foodImagesSrc.length;

function imageLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === totalImages && domContentLoaded) { 
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

// FUNKCIJA ZA PRILAGODITEV VELIKOSTI (PRAVOKOTNIK ZA MOBILCE)
function resizeCanvas() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    const isMobilePortrait = width < 768 && height > width; 
    
    const horizontalMargin = 20;
    const verticalMargin = 100;
    const maxMobileWidth = 400;
    const maxMobileHeight = 700; 

    if (isMobilePortrait) {
        let optimalWidth = width - horizontalMargin;
        optimalWidth = Math.min(optimalWidth, maxMobileWidth);
        canvas.width = Math.floor(optimalWidth / TILE_SIZE) * TILE_SIZE;
        
        let optimalHeight = height - verticalMargin;
        optimalHeight = Math.min(optimalHeight, maxMobileHeight);
        canvas.height = Math.floor(optimalHeight / TILE_SIZE) * TILE_SIZE;
        
    } else {
        let size = Math.min(width - 50, height - 150); 
        size = Math.floor(size / TILE_SIZE) * TILE_SIZE;
        
        canvas.width = size;
        canvas.height = size;
    }
    
    TILE_COUNT_X = canvas.width / TILE_SIZE;
    TILE_COUNT_Y = canvas.height / TILE_SIZE;
}

function adjustSpeed() {
    if (score >= 10) {
        const speedLevel = Math.floor((score - 10) / 10) + 1; 
        
        const newInterval = Math.max(
            INITIAL_SPEED_MS - (speedLevel * SPEED_INCREMENT_MS), 
            50 
        );
        
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, newInterval);
    }
}

function resetGame() {
    resizeCanvas();

    snake = [
        { x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) } 
    ];
    
    velocity = { x: 1, y: 0 };
    score = 0;
    isPaused = false;
    scoreDisplay.textContent = `Točke: ${score}`;
    gameOverMessage.classList.add('hidden');

    food = []; // Seznam hrane se izprazni samo ob zagonu!
    placeFood(); 

    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, INITIAL_SPEED_MS); 
}

function placeFood() {
    // foodToAdd bo ob zagonu 2, ob zaužitju pa 1
    const foodToAdd = FOOD_COUNT - food.length; 

    for (let i = 0; i < foodToAdd; i++) {
        let newFoodPosition;
        do {
            newFoodPosition = { 
                x: Math.floor(Math.random() * TILE_COUNT_X), 
                y: Math.floor(Math.random() * TILE_COUNT_Y) 
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
        
        // Doda samo 1 manjkajoči kos hrane
        placeFood(); 
        
        adjustSpeed(); 
        
    } else {
        snake.pop();
    }

    draw();
}

function checkCollision(head) {
    if (head.x < 0 || head.x >= TILE_COUNT_X || head.y < 0 || head.y >= TILE_COUNT_Y) {
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

    ctx.globalCompositeOperation = 'source-over'; 

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
    
    if (snake.length === 0) return;

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


// --- KONTROLE (PC in SWIPE za Mobilce) ---

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

let touchStartX = 0;
let touchStartY = 0;

if (canvas) { 
    canvas.addEventListener('touchstart', (e) => {
        if (isPaused) {
            resetGame();
            return;
        }
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        e.preventDefault(); 
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        if (Math.abs(diffX) > SWIPE_THRESHOLD || Math.abs(diffY) > SWIPE_THRESHOLD) {
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX < 0) { // Poteg levo
                    if (velocity.x === 0) velocity = { x: -1, y: 0 };
                } else { // Poteg desno
                    if (velocity.x === 0) velocity = { x: 1, y: 0 };
                }
            } else { // Poteg gor/dol
                if (diffY < 0) { // Poteg gor
                    if (velocity.y === 0) velocity = { x: 0, y: -1 };
                } else { // Poteg dol
                    if (velocity.y === 0) velocity = { x: 0, y: 1 };
                }
            }
        }
    });
}


// ZAGON
document.addEventListener('DOMContentLoaded', () => {
    domContentLoaded = true; 
    if (imagesLoadedCount === totalImages) {
        resetGame();
    }
});