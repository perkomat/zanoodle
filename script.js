function draw() {
    // 1. Narisemo ozadje
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Narisemo hrano
    food.forEach(f => {
        ctx.drawImage(f.image, f.x * TILE_SIZE, f.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    if (snake.length === 0) return;

    // 3. Narisemo "podlago" telesa (črna debela črta, ki povezuje krogce)
    ctx.beginPath();
    ctx.lineWidth = TILE_SIZE * 0.8; // Malo ožje od polja
    ctx.strokeStyle = '#000000';    // Črna obroba
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(snake[0].x * TILE_SIZE + TILE_SIZE/2, snake[0].y * TILE_SIZE + TILE_SIZE/2);
    for(let i = 1; i < snake.length; i++) {
        ctx.lineTo(snake[i].x * TILE_SIZE + TILE_SIZE/2, snake[i].y * TILE_SIZE + TILE_SIZE/2);
    }
    ctx.stroke();

    // 4. Narisemo rumene reliefne krogce (brez dodatne črne obrobe okoli vsakega)
    for (let i = snake.length - 1; i > 0; i--) {
        const x = snake[i].x * TILE_SIZE + TILE_SIZE / 2;
        const y = snake[i].y * TILE_SIZE + TILE_SIZE / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, RELIEF_MARKER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = RELIEF_MARKER_COLOR; // Tvoja svetlo rumena #FDFD96
        ctx.fill();
        // Odstranili smo ctx.stroke(), da krogci nimajo črnega roba
    }

    // 5. Narisemo glavo na koncu, da je na vrhu
    ctx.drawImage(headImage, snake[0].x * TILE_SIZE, snake[0].y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}