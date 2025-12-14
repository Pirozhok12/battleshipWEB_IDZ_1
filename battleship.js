        const GameCell = {
            EMPTY: 0,
            SHIP: 1,
            HIT: 2,
            SUNK: 3,
            MISS: 4
        };

        const SIZE = 10;
        let playerField = [];
        let enemyField = [];
        let gameStarted = false;
        let playerTurn = true;
        let shipsPlaced = false;
        
        let botFirstHit = null;
        let botTargets = []; 
        let botLastHit = null; 
        let botDirection = null; // Напрямок добивання (0-вниз, 1-вправо, 2-вгору, 3-вліво)

 
        function init() {
            playerField = Array(SIZE).fill(null)
            .map(() => Array(SIZE).fill(GameCell.EMPTY));
            
            enemyField = Array(SIZE).fill(null)
            .map(() => Array(SIZE).fill(GameCell.EMPTY));
            renderBoards();
        }


        function renderBoards() {
            renderBoard('playerBoard', playerField, true);
            renderBoard('enemyBoard', enemyField, false);
        }

        function renderBoard(boardId, field, showShips) {
            const board = document.getElementById(boardId);
            board.innerHTML = '';
            board.style.gridTemplateColumns = `repeat(${SIZE}, 35px)`;
            
            for (let i = 0; i < SIZE; i++) {
                for (let j = 0; j < SIZE; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    
                    const cellValue = field[i][j];
                    
                    if (cellValue === GameCell.SHIP && showShips) {
                        cell.classList.add('ship');
                        cell.textContent = 'S';
                    } else if (cellValue === GameCell.HIT) {
                        cell.classList.add('hit');
                        cell.textContent = 'X';
                    } else if (cellValue === GameCell.SUNK) {
                        cell.classList.add('sunk');
                        cell.textContent = '$';
                    } else if (cellValue === GameCell.MISS) {
                        cell.classList.add('miss');
                        cell.textContent = '*';
                    } else {
                        cell.classList.add('empty');
                    }
                    
                    if (boardId === 'enemyBoard' && gameStarted && playerTurn) {
                        cell.onclick = () => handlePlayerShot(i, j);
                    } else {
                        cell.classList.add('disabled');
                    }
                    
                    board.appendChild(cell);
                }
            }
        }


        function canPlaceShip(field, length, x, y, horizontal) {
            if (horizontal) {
                if (y + length > SIZE) return false;
                for (let i = 0; i < length; i++) {
                    if (!isCellValid(field, x, y + i)) return false;
                }
            } else {
                if (x + length > SIZE) return false;
                for (let i = 0; i < length; i++) {
                    if (!isCellValid(field, x + i, y)) return false;
                }
            }
            return true;
        }

        function isCellValid(field, x, y) {
            if (field[x][y] !== GameCell.EMPTY) return false;
            
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nx = x + i;
                    const ny = y + j;
                    if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
                        if (field[nx][ny] === GameCell.SHIP) return false;
                    }
                }
            }
            return true;
        }


        function placeShip(field, length, x, y, horizontal) {
            if (horizontal) {
                for (let i = 0; i < length; i++) {
                    field[x][y + i] = GameCell.SHIP;
                }
            } else {
                for (let i = 0; i < length; i++) {
                    field[x + i][y] = GameCell.SHIP;
                }
            }
        }

 
        function autoPlaceShips() {
            playerField = Array(SIZE).fill(null).map(() => Array(SIZE).fill(GameCell.EMPTY));
            const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
            
            for (const shipLength of ships) {
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 1000) {
                    const x = Math.floor(Math.random() * SIZE);
                    const y = Math.floor(Math.random() * SIZE);
                    const horizontal = Math.random() < 0.5;
                    
                    if (canPlaceShip(playerField, shipLength, x, y, horizontal)) {
                        placeShip(playerField, shipLength, x, y, horizontal);
                        placed = true;
                    }
                    attempts++;
                }
            }
            

            enemyField = Array(SIZE).fill(null).map(() => Array(SIZE).fill(GameCell.EMPTY));
            for (const shipLength of ships) {
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 1000) {
                    const x = Math.floor(Math.random() * SIZE);
                    const y = Math.floor(Math.random() * SIZE);
                    const horizontal = Math.random() < 0.5;
                    
                    if (canPlaceShip(enemyField, shipLength, x, y, horizontal)) {
                        placeShip(enemyField, shipLength, x, y, horizontal);
                        placed = true;
                    }
                    attempts++;
                }
            }
            
            shipsPlaced = true;
            document.getElementById('startBtn').disabled = false;
            renderBoards();
            showMessage('Кораблі розставлені! Можна почати гру', 'success');
        }


        function startGame() {
            if (!shipsPlaced) {
                showMessage('Спочатку розставте кораблі!', 'error');
                return;
            }
            
            gameStarted = true;
            playerTurn = true;
            document.getElementById('autoBtn').disabled = true;
            document.getElementById('startBtn').disabled = true;
            
            renderBoards();
            updateTurnInfo();
            showMessage('Гра почалась! Ваш хід - клікайте по полю ворога', 'success');
        }


        function handlePlayerShot(x, y) {
            if (!gameStarted || !playerTurn) return;
            
            const cell = enemyField[x][y];
            
            if (cell === GameCell.HIT || cell === GameCell.SUNK || cell === GameCell.MISS) {
                showMessage('Ви вже стріляли сюди!', 'error');
                return;
            }
            
            if (cell === GameCell.SHIP) {
                enemyField[x][y] = GameCell.HIT;
                

                if (isShipSunk(enemyField, x, y)) {
                    markShipAsSunk(enemyField, x, y);
                    markMissesAroundSunk(enemyField, x, y);
                    showMessage('Корабель потоплено!', 'success');
                } else {
                    showMessage('Влучив! Стріляйте ще раз', 'success');
                }
                
                if (checkWinner(enemyField)) {
                    endGame('Ви перемогли!');
                    return;
                }
            } else {
                enemyField[x][y] = GameCell.MISS;
                showMessage('Промах!', '');
                playerTurn = false;
                
                setTimeout(() => {
                    enemyMove();
                }, 1000);
            }
            
            renderBoards();
            updateTurnInfo();
        }


        function isShipSunk(field, x, y) {
            const visited = Array(SIZE).fill(null).map(() => Array(SIZE).fill(false));
            return checkShipRecursive(field, x, y, visited);
        }

        function checkShipRecursive(field, x, y, visited) {
            if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return true;
            if (visited[x][y]) return true;
            
            visited[x][y] = true;
            
            const cell = field[x][y];
            if (cell === GameCell.EMPTY || cell === GameCell.MISS) return true;
            if (cell === GameCell.SHIP) return false;
            if (cell === GameCell.SUNK) return true;
            if (cell === GameCell.HIT) {
                return checkShipRecursive(field, x - 1, y, visited) &&
                       checkShipRecursive(field, x + 1, y, visited) &&
                       checkShipRecursive(field, x, y - 1, visited) &&
                       checkShipRecursive(field, x, y + 1, visited);
            }
            
            return true;
        }

        function markShipAsSunk(field, x, y) {
            const visited = Array(SIZE).fill(null).map(() => Array(SIZE).fill(false));
            markSunkRecursive(field, x, y, visited);
        }

        function markSunkRecursive(field, x, y, visited) {
            if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
            if (visited[x][y]) return;
            if (field[x][y] !== GameCell.HIT) return;
            
            visited[x][y] = true;
            field[x][y] = GameCell.SUNK;
            
            markSunkRecursive(field, x - 1, y, visited);
            markSunkRecursive(field, x + 1, y, visited);
            markSunkRecursive(field, x, y - 1, visited);
            markSunkRecursive(field, x, y + 1, visited);
        }

        function markMissesAroundSunk(field, x, y) {
            const visited = Array(SIZE).fill(null).map(() => Array(SIZE).fill(false));
            const sunkCells = [];
            collectSunkCells(field, x, y, visited, sunkCells);
            
            for (const [sx, sy] of sunkCells) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const nx = sx + i;
                        const ny = sy + j;
                        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
                            if (field[nx][ny] === GameCell.EMPTY) {
                                field[nx][ny] = GameCell.MISS;
                            }
                        }
                    }
                }
            }
        }

        function collectSunkCells(field, x, y, visited, cells) {
            if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
            if (visited[x][y]) return;
            if (field[x][y] !== GameCell.SUNK) return;
            
            visited[x][y] = true;
            cells.push([x, y]);
            
            collectSunkCells(field, x - 1, y, visited, cells);
            collectSunkCells(field, x + 1, y, visited, cells);
            collectSunkCells(field, x, y - 1, visited, cells);
            collectSunkCells(field, x, y + 1, visited, cells);
        }


function enemyMove() {
            let x, y;
            
            if (botLastHit && botDirection !== null) {
                const next = getNextInDirection(botLastHit.x, botLastHit.y, botDirection);
                
                if (next && isValidTarget(next.x, next.y)) {
                    x = next.x;
                    y = next.y;
                } else {
                    // Міняємо напрямок на протилежний від першого влучання
                    botDirection = (botDirection + 2) % 4;
                    const opposite = getNextInDirection(botFirstHit.x, botFirstHit.y, botDirection);
                    
                    if (opposite && isValidTarget(opposite.x, opposite.y)) {
                        x = opposite.x;
                        y = opposite.y;
                    } else {
                        // Скидаємо стан
                        botLastHit = null;
                        botFirstHit = null;
                        botDirection = null;
                        botTargets = [];
                        x = getRandomTarget().x;
                        y = getRandomTarget().y;
                    }
                }
            }
            // Якщо є цілі для добивання (після першого влучання)
            else if (botTargets.length > 0) {
                const target = botTargets.shift();
                x = target.x;
                y = target.y;
            }
            // Випадковий постріл
            else {
                const target = getRandomTarget();
                x = target.x;
                y = target.y;
            }
            
            const cell = playerField[x][y];
            
            if (cell === GameCell.SHIP) {
                playerField[x][y] = GameCell.HIT;
                
                // Визначаємо напрямок після другого влучання
                if (botLastHit && botDirection === null) {
                    botDirection = getDirection(botLastHit.x, botLastHit.y, x, y);
                    botTargets = []; // Очищаємо сусідів, тепер стріляємо по лінії
                }
                
                if (isShipSunk(playerField, x, y)) {
                    markShipAsSunk(playerField, x, y);
                    markMissesAroundSunk(playerField, x, y);
                    showMessage('Ворог потопив ваш корабель!', 'error');
                    // Скидаємо стан після потоплення
                    botLastHit = null;
                    botFirstHit = null;
                    botDirection = null;
                    botTargets = [];
                } else {
                    showMessage('Ворог влучив!', 'error');
                    
                    // Якщо перше влучання - запам'ятовуємо і додаємо сусідів
                    if (!botLastHit) {
                        botLastHit = { x, y };
                        botFirstHit = { x, y };
                        const neighbors = getNeighbors(x, y);
                        botTargets.push(...neighbors);
                    } else {
                        // Друге+ влучання - оновлюємо останню позицію
                        botLastHit = { x, y };
                    }
                }
                
                if (checkWinner(playerField)) {
                    endGame('Ворог переміг!');
                    return;
                }
                
                setTimeout(() => {
                    enemyMove();
                }, 1000);
            } else {
                playerField[x][y] = GameCell.MISS;
                showMessage('Ворог промахнувся! Ваш хід', 'success');
                playerTurn = true;
            }
            
            renderBoards();
            updateTurnInfo();
        }
        

        function isValidTarget(x, y) {
            if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return false;
            const cell = playerField[x][y];
            return cell !== GameCell.HIT && cell !== GameCell.SUNK && cell !== GameCell.MISS;
        }
        
        function getRandomTarget() {
            let x, y;
            let attempts = 0;
            
            do {
                x = Math.floor(Math.random() * SIZE);
                y = Math.floor(Math.random() * SIZE);
                attempts++;
            } while (!isValidTarget(x, y) /*&& attempts < 1000*/);
            
            return { x, y };
        }
        
        function getNeighbors(x, y) {
            const neighbors = [];
            const directions = [
                { x: x - 1, y: y }, // вгору
                { x: x + 1, y: y }, // вниз
                { x: x, y: y - 1 }, // вліво
                { x: x, y: y + 1 }  // вправо
            ];
            
            for (const dir of directions) {
                if (isValidTarget(dir.x, dir.y)) {
                    neighbors.push(dir);
                }
            }
            
            return neighbors;
        }
        
        function getNextInDirection(x, y, direction) {
            const moves = [
                { x: x + 1, y: y }, // 0 - вниз
                { x: x, y: y + 1 }, // 1 - вправо
                { x: x - 1, y: y }, // 2 - вгору
                { x: x, y: y - 1 }  // 3 - вліво
            ];
            
            return moves[direction];
        }
        
        function getDirection(x1, y1, x2, y2) {
            if (x2 > x1){ 
                console.log("вниз"); 
                return 0;} 
            if (y2 > y1){ 
                console.log("вправо");
                return 1;} 
            if (x2 < x1){ 
                console.log("вгору");
                return 2;} 
            if (y2 < y1){ 
                console.log("вліво");
                return 3;} 
            return null;
        }

        function checkWinner(field) {
            for (let i = 0; i < SIZE; i++) {
                for (let j = 0; j < SIZE; j++) {
                    if (field[i][j] === GameCell.SHIP) return false;
                }
            }
            return true;
        }

        function endGame(msg) {
            gameStarted = false;
            showMessage(msg, 'success');
            renderBoard('playerBoard', playerField, true);
            renderBoard('enemyBoard', enemyField, true);
        }

        function updateTurnInfo() {
            const info = document.getElementById('turnInfo');
            if (gameStarted) {
                info.textContent = playerTurn ? 'Ваш хід' : 'Хід ворога...';
            } else {
                info.textContent = '';
            }
        }

        function showMessage(msg, type) {
            const msgEl = document.getElementById('message');
            msgEl.textContent = msg;
            msgEl.className = 'message ' + type;
        }

        function resetGame() {
            gameStarted = false;
            playerTurn = true;
            shipsPlaced = false;
            botTargets = [];
            botLastHit = null;
            botDirection = null;
            document.getElementById('autoBtn').disabled = false;
            document.getElementById('startBtn').disabled = true;
            init();
            showMessage('Розставте кораблі та почніть нову гру!', '');
            updateTurnInfo();
        }

        init ();
        showMessage('Натисніть "Авто-розстановка" для початку', '');