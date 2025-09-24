document.addEventListener('DOMContentLoaded', () => {
    const gameSetup = document.getElementById('game-setup');
    const gameContainer = document.getElementById('game-container');
    const playerCountSelect = document.getElementById('playerCount');
    const playerNamesContainer = document.getElementById('player-names');
    const startGameButton = document.getElementById('startGame');
    const restartGameButton = document.getElementById('restartGame');
    const playAgainButton = document.getElementById('playAgain');
    const gameBoard = document.getElementById('game-board');
    const currentPlayerNameSpan = document.getElementById('currentPlayerName');
    const nextNumberSpan = document.getElementById('nextNumber');
    const scoresDiv = document.getElementById('scores');
    const winnerOverlay = document.getElementById('winner-overlay');
    const winnerText = document.getElementById('winnerText');

    const jsConfetti = new JSConfetti();

    let playerCount = 2;
    let playerNames = [];
    let currentPlayerIndex = 0;
    let playerNumbers = [];
    let boardState = [];
    let gameEnded = false;

    function updatePlayerNameInputs() {
        playerCount = parseInt(playerCountSelect.value);
        playerNamesContainer.innerHTML = '';
        for (let i = 1; i <= playerCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Player ${i} Name`;
            input.className = 'player-name-input';
            input.value = `Player ${i}`;
            const group = document.createElement('div');
            group.className = 'control-group';
            group.appendChild(input);
            playerNamesContainer.appendChild(group);
        }
    }

    playerCountSelect.addEventListener('change', updatePlayerNameInputs);

    startGameButton.addEventListener('click', () => {
        const nameInputs = document.querySelectorAll('.player-name-input');
        playerNames = Array.from(nameInputs).map(input => input.value || input.placeholder);
        
        gameSetup.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        startGame();
    });
    
    restartGameButton.addEventListener('click', () => {
        gameContainer.classList.add('hidden');
        gameSetup.classList.remove('hidden');
        winnerOverlay.classList.add('hidden');
    });

    playAgainButton.addEventListener('click', () => {
        winnerOverlay.classList.add('hidden');
        startGame();
    });

    function startGame() {
        gameEnded = false;
        currentPlayerIndex = 0;
        playerNumbers = Array(playerCount).fill(1);
        scoresDiv.innerHTML = '';
        updateGameInfo();
        initializeBoard();
    }

    function initializeBoard() {
        gameBoard.innerHTML = '';
        boardState = [];
        const rows = playerCount === 2 ? 6 : 7;
        for (let i = 1; i <= rows; i++) {
            const rowEl = document.createElement('div');
            rowEl.classList.add('row');
            const rowCircles = [];
            for (let j = 0; j < i; j++) {
                const circle = document.createElement('div');
                circle.classList.add('circle');
                circle.dataset.row = i - 1;
                circle.dataset.col = j;
                circle.addEventListener('click', handleCircleClick);
                rowEl.appendChild(circle);
                rowCircles.push({ element: circle, value: 0, player: -1 });
            }
            gameBoard.appendChild(rowEl);
            boardState.push(rowCircles);
        }
    }

    function handleCircleClick(event) {
        if (gameEnded) return;

        const circle = event.target;
        if (circle.textContent !== '') return;

        const maxNumber = playerCount === 2 ? 10 : 9;
        if (playerNumbers[currentPlayerIndex] > maxNumber) return;

        const row = parseInt(circle.dataset.row);
        const col = parseInt(circle.dataset.col);

        const currentNumber = playerNumbers[currentPlayerIndex];
        circle.textContent = currentNumber;
        circle.classList.add(`player${currentPlayerIndex + 1}`, 'placed');
        boardState[row][col].value = currentNumber;
        boardState[row][col].player = currentPlayerIndex;

        playerNumbers[currentPlayerIndex]++;
        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
        updateGameInfo();

        if (isBoardFull()) {
            endGame();
        }
    }

    function isBoardFull() {
        const totalCircles = playerCount === 2 ? 21 : 28;
        const placedNumbers = playerNumbers.reduce((sum, num) => sum + num - 1, 0);
        return placedNumbers >= totalCircles - 1;
    }

    function endGame() {
        gameEnded = true;
        let blackHole = null;

        for (let i = 0; i < boardState.length; i++) {
            for (let j = 0; j < boardState[i].length; j++) {
                if (boardState[i][j].value === 0) {
                    blackHole = { row: i, col: j };
                    boardState[i][j].element.classList.add('black-hole');
                    break;
                }
            }
            if (blackHole) break;
        }

        calculateScores(blackHole);
    }
    
    function getNeighbors(row, col) {
        const neighbors = [];
        const numRows = boardState.length;
        
        // Potential neighbors relative to the current circle
        const neighborCoords = [
            { r: row - 1, c: col - 1 }, { r: row - 1, c: col },
            { r: row,     c: col - 1 }, { r: row,     c: col + 1 },
            { r: row + 1, c: col },     { r: row + 1, c: col + 1 }
        ];

        neighborCoords.forEach(coord => {
            if (coord.r >= 0 && coord.r < numRows &&
                coord.c >= 0 && coord.c < boardState[coord.r].length) {
                neighbors.push(boardState[coord.r][coord.c]);
            }
        });

        return neighbors;
    }

    function calculateScores(blackHole) {
        const scores = Array(playerCount).fill(0);
        if (!blackHole) return;

        const neighbors = getNeighbors(blackHole.row, blackHole.col);

        neighbors.forEach(neighbor => {
            if (neighbor.player !== -1) {
                scores[neighbor.player] += neighbor.value;
            }
        });
        
        displayScores(scores);
    }

    function displayScores(scores) {
        scoresDiv.innerHTML = '<h2>Final Scores</h2>';
        let minScore = Infinity;
        let winners = [];

        for (let i = 0; i < playerCount; i++) {
            const scoreP = document.createElement('p');
            scoreP.textContent = `${playerNames[i]}: ${scores[i]}`;
            scoresDiv.appendChild(scoreP);
            if (scores[i] < minScore) {
                minScore = scores[i];
                winners = [i];
            } else if (scores[i] === minScore) {
                winners.push(i);
            }
        }
        
        let winnerMessage = '';
        if (winners.length > 1) {
            const winnerNames = winners.map(i => playerNames[i]).join(' & ');
            winnerMessage = `It's a tie between ${winnerNames}!`;
        } else {
            winnerMessage = `${playerNames[winners[0]]} Wins!`;
            jsConfetti.addConfetti({
                emojis: ['🎉', '🎊', '✨', '🎈', '🏆'],
            });
        }
        
        winnerText.textContent = winnerMessage;
        winnerOverlay.classList.remove('hidden');
    }

    function updateGameInfo() {
        currentPlayerNameSpan.textContent = playerNames[currentPlayerIndex];
        const maxNumber = playerCount === 2 ? 10 : 9;
        if (playerNumbers[currentPlayerIndex] <= maxNumber) {
            nextNumberSpan.textContent = playerNumbers[currentPlayerIndex];
        } else {
            nextNumberSpan.textContent = '-';
        }
    }
    
    updatePlayerNameInputs();
});