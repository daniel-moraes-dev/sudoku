/* ==========================================
   CLASSE SUDOKU - LÓGICA DO JOGO (TIMER APENAS NO NOVO JOGO)
   ========================================== */

class Sudoku {
    constructor() {
        // Inicializar propriedades
        this.solvedBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.puzzleBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill(null).map(() => Array(9).fill(0));

        this.difficulty = 'medium';
        this.timerInterval = null;
        this.timeElapsed = 0;
        this.errorCount = 0;
        this.maxErrors = 5;
        this.gameActive = false;     // Jogo só fica ativo após clicar Novo Jogo
        this.completedNumbers = new Set();
        this.selectedCell = { row: null, col: null };

        // Elementos do DOM
        this.boardElement = document.getElementById('sudokuBoard');
        this.timerElement = document.getElementById('timer');
        this.difficultyElement = document.getElementById('difficulty');
        this.errorsElement = document.getElementById('errors');
        this.messageElement = document.getElementById('message');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.numbersPanel = document.getElementById('numbersPanel');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.solveBtn = document.getElementById('solveBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.clearBtn = document.getElementById('clearBtn');

        // Event listeners
        this.attachEventListeners();

        // Apenas prepara a interface inicial (SEM iniciar jogo / SEM timer)
        this.renderEmptyBoard();
        this.renderNumbersPanel();
        this.updateUI(); // Mostra 00:00 e erros zerados
    }

    /* ============================ EVENTOS ============================ */

    attachEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.solveBtn.addEventListener('click', () => this.solve());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.clearBtn.addEventListener('click', () => this.newGame());

        // Numpad
        const numpadEl = document.getElementById('numpad');
        if (numpadEl) {
            numpadEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.numpad-btn');
                if (!btn) return;
                const val = btn.getAttribute('data-val');

                if (!this.gameActive) return;

                const { row, col } = this.selectedCell;
                const input =
                    row !== null && col !== null
                        ? document.getElementById(`cell-${row}-${col}`)
                        : null;

                if (!input || input.disabled) return;

                if (val === 'clear' || val === 'back') {
                    input.value = '';
                    this.onCellChange(row, col);
                } else {
                    this.onNumberClick(parseInt(val, 10));
                }
            });
        }

        // Fechar numpad ao clicar fora
        document.addEventListener('click', (e) => {
            const numpadSection = document.getElementById('numpadSection');
            if (!numpadSection) return;

            const insideNumpad = e.target.closest('#numpad');
            const insideCell = e.target.closest('.sudoku-cell');

            if (!insideNumpad && !insideCell) {
                numpadSection.setAttribute('aria-hidden', 'true');
            }
        });
    }

    /* ============================ NOVO JOGO ============================ */

    newGame() {
        this.difficulty = this.difficultySelect.value;

        // Reset total
        this.timeElapsed = 0;
        this.errorCount = 0;
        this.completedNumbers.clear();
        this.gameActive = true;

        clearInterval(this.timerInterval);

        // Gerar novo tabuleiro
        this.generateBoard();
        this.renderBoard();
        this.renderNumbersPanel();
        this.updateNumbersPanel();

        this.updateUI();

        // Agora sim inicia o timer!
        this.startTimer();

        if (this.isMobile()) this.showNumpad();
        else this.hideNumpad();

        this.showMessage("Novo jogo iniciado!", "success");
    }

    /* ============================ GERAR TABULEIRO ============================ */

    generateBoard() {
        this.solvedBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard(this.solvedBoard);

        this.puzzleBoard = this.solvedBoard.map(r => [...r]);

        const remove = this.getCellsToRemove(this.difficulty);
        this.removeNumbers(remove);

        this.initialBoard = this.puzzleBoard.map(r => [...r]);
    }

    fillBoard(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    let nums = this.getValidNumbers(board, r, c);
                    this.shuffle(nums);

                    for (let n of nums) {
                        board[r][c] = n;
                        if (this.fillBoard(board)) return true;
                        board[r][c] = 0;
                    }
                    return false;
                }
            }
        }
        return true;
    }

    getValidNumbers(board, row, col) {
        const v = [];
        for (let n = 1; n <= 9; n++) {
            if (this.isValidPlacement(board, row, col, n)) v.push(n);
        }
        return v;
    }

    isValidPlacement(board, row, col, num) {
        for (let i = 0; i < 9; i++) if (board[row][i] === num) return false;
        for (let i = 0; i < 9; i++) if (board[i][col] === num) return false;

        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;

        for (let r = br; r < br + 3; r++)
            for (let c = bc; c < bc + 3; c++)
                if (board[r][c] === num) return false;

        return true;
    }

    getCellsToRemove(difficulty) {
        return { easy: 40, medium: 50, hard: 60 }[difficulty] || 40;
    }

    removeNumbers(amount) {
        let removed = 0;
        while (removed < amount) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (this.puzzleBoard[r][c] !== 0) {
                this.puzzleBoard[r][c] = 0;
                removed++;
            }
        }
    }

    /* ============================ RENDERIZAÇÃO ============================ */

    renderEmptyBoard() {
        this.boardElement.innerHTML = '';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';

                const input = document.createElement('input');
                input.type = 'text';
                input.disabled = true;

                cell.appendChild(input);
                this.boardElement.appendChild(cell);
            }
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = "sudoku-cell";

                const input = document.createElement('input');
                input.type = "text";
                input.inputMode = "numeric";
                input.maxLength = 1;
                input.id = `cell-${r}-${c}`;

                if (this.initialBoard[r][c] !== 0) {
                    input.value = this.initialBoard[r][c];
                    input.disabled = true;
                    cell.classList.add("locked");
                }

                input.addEventListener('focus', () => {
                    this.selectedCell = { row: r, col: c };
                    this.onCellFocus(r, c);
                    if (this.isMobile()) this.showNumpad();
                });

                input.addEventListener('input', () => {
                    this.onCellChange(r, c);
                });

                cell.appendChild(input);
                this.boardElement.appendChild(cell);
            }
        }
    }

    renderNumbersPanel() {
        this.numbersPanel.innerHTML = '';

        for (let n = 1; n <= 9; n++) {
            const el = document.createElement('div');
            el.className = 'number-item';
            el.id = `number-${n}`;
            el.textContent = n;
            el.addEventListener('click', () => this.onNumberClick(n));
            this.numbersPanel.appendChild(el);
        }
    }

    /* ============================ INTERAÇÃO DO JOGADOR ============================ */

    onNumberClick(num) {
        if (!this.gameActive) return;

        const { row, col } = this.selectedCell;
        if (row === null || col === null) return;

        const input = document.getElementById(`cell-${row}-${col}`);
        if (input.disabled) return;

        input.value = num;
        this.onCellChange(row, col);
    }

    onCellChange(row, col) {
        if (!this.gameActive) return;

        const input = document.getElementById(`cell-${row}-${col}`);
        const v = parseInt(input.value, 10);

        input.parentElement.classList.remove("error", "valid");

        if (isNaN(v) || v < 1 || v > 9) {
            input.value = '';
            return;
        }

        if (v !== this.solvedBoard[row][col]) {
            input.parentElement.classList.add("error");
            this.increaseErrorCount();
            input.value = '';
            return;
        }

        input.parentElement.classList.add("valid");
        this.updateNumbersPanel();

        if (this.checkWin()) {
            this.gameActive = false;
            clearInterval(this.timerInterval);
            this.disableBoardInputs();
            this.showMessage("🎉 Parabéns! Você resolveu!", "success");
        }
    }

    onCellFocus(r, c) {
        document.querySelectorAll('.sudoku-cell').forEach(cell =>
            cell.classList.remove('highlight')
        );

        document.getElementById(`cell-${r}-${c}`).parentElement.classList.add('highlight');
    }

    disableBoardInputs() {
        document.querySelectorAll('.sudoku-cell input').forEach(inp => inp.disabled = true);
    }

    /* ============================ LÓGICA ============================ */

    updateNumbersPanel() {
        for (let n = 1; n <= 9; n++) {
            const btn = document.getElementById(`number-${n}`);
            const count = this.countCorrect(n);
            if (count === 9) btn.classList.add('completed');
            else btn.classList.remove('completed');
        }
    }

    countCorrect(n) {
        let c = 0;
        for (let r = 0; r < 9; r++)
            for (let col = 0; col < 9; col++)
                if (this.solvedBoard[r][col] === n) {
                    const val = document.getElementById(`cell-${r}-${col}`).value;
                    if (parseInt(val, 10) === n) c++;
                }
        return c;
    }

    checkWin() {
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++) {
                const val = document.getElementById(`cell-${r}-${c}`).value;
                if (parseInt(val, 10) !== this.solvedBoard[r][c]) return false;
            }
        return true;
    }

    increaseErrorCount() {
        this.errorCount++;
        this.updateUI();

        if (this.errorCount >= this.maxErrors) {
            this.gameActive = false;
            clearInterval(this.timerInterval);
            this.disableBoardInputs();
            this.showMessage("❌ Limite de erros atingido!", "error");
        }
    }

    /* ============================ TIMER ============================ */

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateUI();
        }, 1000);
    }

    /* ============================ UI ============================ */

    updateUI() {
        this.timerElement.textContent =
            String(Math.floor(this.timeElapsed / 60)).padStart(2, '0') +
            ":" +
            String(this.timeElapsed % 60).padStart(2, '0');

        const map = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
        this.difficultyElement.textContent = map[this.difficulty];
        this.errorsElement.textContent = `${this.errorCount}/${this.maxErrors}`;
    }

    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;

        setTimeout(() => {
            this.messageElement.className = "message";
        }, 3000);
    }

    /* ============================ UTILS ============================ */

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    isMobile() {
        return 'ontouchstart' in window || window.innerWidth <= 768;
    }
}

/* =============== INICIAR INTERFACE QUANDO A PÁGINA CARREGAR =============== */

document.addEventListener("DOMContentLoaded", () => {
    new Sudoku();
});
