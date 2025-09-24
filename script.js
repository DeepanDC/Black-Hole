document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const gameSetup = document.getElementById('game-setup');
    const gameContainer = document.getElementById('game-container');
    const playerCountSelect = document.getElementById('playerCount');
    const playWithBotCheckbox = document.getElementById('playWithBot');
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
    const playerIcons = [
        document.getElementById('player1-icon'),
        document.getElementById('player2-icon'),
        document.getElementById('player3-icon')
    ];
    const themeToggle = document.getElementById('theme-checkbox');

    const jsConfetti = new JSConfetti();

    // --- GAME STATE VARIABLES ---
    let playerCount = 2;
    let playerNames = [];
    let currentPlayerIndex = 0;
    let playerNumbers = [];
    let boardState = [];
    let gameEnded = false;
    let isBotGame = false;
    let isBotThinking = false;

    // --- THEME SWITCH LOGIC (RUNS IMMEDIATELY) ---
    (function () {
        function applyTheme(theme) {
            document.body.classList.toggle('dark-theme', theme === 'dark');
            themeToggle.checked = theme === 'dark';
        }

        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    })();
    
    // --- GAME FUNCTIONS ---
    function getInitials(name = '') {
        const parts = name.trim().split(' ').filter(p => p);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    function setupPlayerIcons() {
        playerIcons.forEach(icon => {
            icon.style.display = 'none';
            icon.classList.remove('bot-icon', 'active');
            icon.textContent = '';
        });

        for (let i = 0; i < playerCount; i++) {
            const icon = playerIcons[i];
            icon.style.display = 'flex';
            if (isBotGame && i === 1) {
                icon.classList.add('bot-icon');
            } else {
                icon.textContent = getInitials(playerNames[i]);
            }
        }
        
        if (playerCount === 2) {
            playerIcons[2].style.display = 'none';
        }
    }

    function updateActivePlayerIcon() {
        playerIcons.forEach((icon, index) => {
            icon.classList.toggle('active', index === currentPlayerIndex && !gameEnded);
        });
    }

    function updatePlayerNameInputs() {
        isBotGame = playWithBotCheckbox.checked;
        playerCount = isBotGame ? 2 : parseInt(playerCountSelect.value);
        playerCountSelect.value = playerCount;
        playerCountSelect.disabled = isBotGame;

        playerNamesContainer.innerHTML = '';
        for (let i = 1; i <= playerCount; i++) {
            const group = document.createElement('div');
            group.className = 'control-group';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Player ${i} Name`;
            input.className = 'player-name-input';
            
            if (isBotGame && i === 2) {
                input.value = 'DC Bot';
                input.disabled = true;
            } else {
                input.value = `Player ${i}`;
            }
            group.appendChild(input);
            playerNamesContainer.appendChild(group);
        }
    }

    function startGame() {
        gameEnded = false;
        isBotThinking = false;
        currentPlayerIndex = 0;
        playerNumbers = Array(playerCount).fill(1);
        scoresDiv.innerHTML = '';
        
        setupPlayerIcons();
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
            for (let j = 0; j < i; j++) {
                const circle = document.createElement('div');
                circle.classList.add('circle');
                circle.dataset.row = i - 1;
                circle.dataset.col = j;
                circle.addEventListener('click', handleCircleClick);
                rowEl.appendChild(circle);
                boardState.push({ element: circle, value: 0, player: -1, row: i-1, col: j });
            }
            gameBoard.appendChild(rowEl);
        }
    }

    function handleCircleClick(event) {
        if (gameEnded || isBotThinking || event.target.classList.contains('placed')) return;
        
        placeNumber(event.target, currentPlayerIndex);
        if (isBoardFull()) { endGame(); return; }

        switchPlayer();
        
        if (isBotGame && currentPlayerIndex === 1 && !gameEnded) {
            makeBotMove();
        }
    }
    
    function switchPlayer() {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
        updateGameInfo();
    }
    
    function placeNumber(circleElement, playerIdx) {
        const maxNumber = playerCount === 2 ? 10 : 9;
        if (playerNumbers[playerIdx] > maxNumber) return;
        
        const row = parseInt(circleElement.dataset.row);
        const col = parseInt(circleElement.dataset.col);
        const stateIndex = boardState.findIndex(c => c.row === row && c.col === col);

        const currentNumber = playerNumbers[playerIdx];
        circleElement.textContent = currentNumber;
        circleElement.classList.add(`player${playerIdx + 1}`, 'placed');
        
        if(stateIndex !== -1) {
            boardState[stateIndex].value = currentNumber;
            boardState[stateIndex].player = playerIdx;
        }
        playerNumbers[playerIdx]++;
    }

    function makeBotMove() {
        isBotThinking = true;
        updateActivePlayerIcon();
        setTimeout(() => {
            const availableCircles = boardState.filter(c => c.value === 0);
            if (availableCircles.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableCircles.length);
                placeNumber(availableCircles[randomIndex].element, currentPlayerIndex);
            }
            
            if (isBoardFull()) { endGame(); return; }
            
            switchPlayer();
            isBotThinking = false;
        }, 1200);
    }

    function isBoardFull() {
        const totalCircles = playerCount === 2 ? 21 : 28;
        return playerNumbers.reduce((sum, num) => sum + num - 1, 0) >= totalCircles - 1;
    }

    function endGame() {
        gameEnded = true;
        updateActivePlayerIcon();
        let blackHole = null;
        boardState.forEach(circle => {
            if (circle.value === 0) {
                blackHole = { row: circle.row, col: circle.col };
                circle.element.classList.add('black-hole');
            }
        });
        calculateScores(blackHole);
    }
    
    function getNeighbors(row, col) {
        const neighbors = [];
        const coords = [{r:row-1,c:col-1},{r:row-1,c:col},{r:row,c:col-1},{r:row,c:col+1},{r:row+1,c:col},{r:row+1,c:col+1}];
        coords.forEach(c => {
            const neighbor = boardState.find(s => s.row === c.r && s.col === c.c);
            if (neighbor) neighbors.push(neighbor);
        });
        return neighbors;
    }

    function calculateScores(blackHole) {
        const scores = Array(playerCount).fill(0);
        if (!blackHole) return;
        getNeighbors(blackHole.row, blackHole.col).forEach(neighbor => {
            if (neighbor.player !== -1) scores[neighbor.player] += neighbor.value;
        });
        displayScores(scores);
    }

    function displayScores(scores) {
        scoresDiv.innerHTML = '<h2>Final Scores</h2>';
        let minScore = Infinity, winners = [];
        scores.forEach((score, i) => {
            const scoreP = document.createElement('p');
            scoreP.textContent = `${playerNames[i]}: ${score}`;
            scoresDiv.appendChild(scoreP);
            if (score < minScore) { minScore = score; winners = [i]; } 
            else if (score === minScore) { winners.push(i); }
        });
        const winnerNames = winners.map(i => playerNames[i]).join(' & ');
        winnerText.textContent = winners.length > 1 ? `It's a tie: ${winnerNames}!` : `${winnerNames} Wins!`;
        winnerOverlay.classList.remove('hidden');
        if (winners.length === 1 && (!isBotGame || winners[0] === 0)) {
            jsConfetti.addConfetti({ emojis: ['🎉', '✨', '🏆'] });
        }
    }

    function updateGameInfo() {
        currentPlayerNameSpan.textContent = playerNames[currentPlayerIndex];
        const maxNumber = playerCount === 2 ? 10 : 9;
        nextNumberSpan.textContent = playerNumbers[currentPlayerIndex] <= maxNumber ? playerNumbers[currentPlayerIndex] : '—';
        updateActivePlayerIcon();
    }

    // --- EVENT LISTENERS ---
    playWithBotCheckbox.addEventListener('change', updatePlayerNameInputs);
    playerCountSelect.addEventListener('change', updatePlayerNameInputs);
    startGameButton.addEventListener('click', () => {
        playerNames = Array.from(document.querySelectorAll('.player-name-input')).map(input => input.value || input.placeholder);
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

    // --- INITIALIZE ---
    updatePlayerNameInputs();
});