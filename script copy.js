/* ==========================================
   CLASSE SUDOKU - LÓGICA DO JOGO (VERSÃO CORRIGIDA)
   ========================================== */

class Sudoku {
    constructor() {
        // Inicializar propriedades
        this.solvedBoard = Array(9).fill(null).map(() => Array(9).fill(0));  // Solução completa
        this.puzzleBoard = Array(9).fill(null).map(() => Array(9).fill(0));  // Puzzle com números removidos
        this.initialBoard = Array(9).fill(null).map(() => Array(9).fill(0)); // Estado inicial (números pré-preenchidos)
        this.difficulty = 'medium';
        this.timerInterval = null;
        this.timeElapsed = 0;
        this.errorCount = 0;
        this.maxErrors = 5;
        this.gameActive = true;
        this.completedNumbers = new Set(); // Rastrear números completos
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
        
        // Iniciar com um novo jogo
        //this.newGame();
        this.renderNumbersPanel();
        this.updateUI();
    }

    /**
     * Anexar event listeners aos botões e seletores
     */
    attachEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.solveBtn.addEventListener('click', () => this.solve());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.clearBtn.addEventListener('click', () => this.clear());

        // Numpad (clicks do teclado visual)
        const numpadEl = document.getElementById('numpad');
        if (numpadEl) {
            numpadEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.numpad-btn');
                if (!btn) return;
                const val = btn.getAttribute('data-val');
                if (!val) return;

                const { row, col } = this.selectedCell;
                const input = (row !== null && col !== null)
                    ? document.getElementById(`cell-${row}-${col}`)
                    : null;

                if (val === 'clear' || val === 'back') {
                    if (!this.gameActive || !input || input.disabled) return;
                    input.value = '';
                    this.onCellChange(row, col);
                } else {
                    const num = parseInt(val, 10);
                    this.onNumberClick(num);
                }
            });
        }

        // Esconder numpad ao clicar fora (útil em mobile)
        document.addEventListener('click', (e) => {
            const numpadSection = document.getElementById('numpadSection');
            if (!numpadSection) return;
            const target = e.target;
            const isInsideNumpad = target.closest && target.closest('#numpad');
            const isCell = target.closest && target.closest('.sudoku-cell');
            if (!isInsideNumpad && !isCell) {
                numpadSection.setAttribute('aria-hidden', 'true');
            }
        });
    }

    /**
     * Iniciar novo jogo
     */
    newGame() {
        // Obter dificuldade selecionada
        this.difficulty = this.difficultySelect.value;
        
        // Resetar variáveis
        this.timeElapsed = 0;
        this.errorCount = 0;
        this.gameActive = true;
        this.completedNumbers.clear();
        clearInterval(this.timerInterval);
        
        // Gerar novo tabuleiro
        this.generateBoard();
        
        // Renderizar tabuleiro
        this.renderBoard();
        
        // Renderizar painel de números
        this.renderNumbersPanel();
        
        // Atualizar painel de números (marca completados)
        this.updateNumbersPanel();
        
        // Tentar restaurar progresso salvo para esse puzzle (se existir)
        this.attemptRestoreProgress();
        
        // Atualizar UI
        this.updateUI();
        
        // Iniciar timer
        this.startTimer();
        
        // Mostrar mensagem
        this.showMessage('Novo jogo iniciado!', 'success');

        // Mostrar numpad em mobile automaticamente
        if (this.isMobile()) {
            this.showNumpad();
        } else {
            this.hideNumpad();
        }
    }

    /**
     * Gerar um tabuleiro válido de Sudoku
     */
    generateBoard() {
        // Criar tabuleiro vazio
        this.solvedBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        
        // Preencher tabuleiro com solução válida
        this.fillBoard(this.solvedBoard);
        
        // Clonar para criar o puzzle (remover números)
        this.puzzleBoard = this.solvedBoard.map(row => [...row]);
        
        // Remover números baseado na dificuldade
        const cellsToRemove = this.getCellsToRemove(this.difficulty);
        this.removeNumbers(cellsToRemove);
        
        // Clonar puzzle como estado inicial (números pré-preenchidos)
        this.initialBoard = this.puzzleBoard.map(row => [...row]);
    }

    /**
     * Preencher tabuleiro com números válidos (backtracking)
     */
    fillBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const validNumbers = this.getValidNumbers(board, row, col);
                    this.shuffle(validNumbers);
                    
                    for (const num of validNumbers) {
                        board[row][col] = num;
                        if (this.fillBoard(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Obter números válidos para uma posição
     */
    getValidNumbers(board, row, col) {
        const validNumbers = [];
        for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
                validNumbers.push(num);
            }
        }
        return validNumbers;
    }

    /**
     * Validar se um número pode ser colocado em uma posição (geração)
     */
    isValidPlacement(board, row, col, num) {
        // Verificar linha
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }
        // Verificar coluna
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }
        // Verificar bloco 3x3
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        for (let i = blockRow; i < blockRow + 3; i++) {
            for (let j = blockCol; j < blockCol + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }
        return true;
    }

    /**
     * Obter quantidade de células a remover baseado na dificuldade
     */
    getCellsToRemove(difficulty) {
        const difficultyMap = {
            easy: 40,
            medium: 50,
            hard: 60
        };
        return difficultyMap[difficulty] || 40;
    }

    /**
     * Remover números do tabuleiro (criar puzzle)
     */
    removeNumbers(count) {
        let removed = 0;
        while (removed < count) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (this.puzzleBoard[row][col] !== 0) {
                this.puzzleBoard[row][col] = 0;
                removed++;
            }
        }
    }

    /**
     * Renderizar tabuleiro na tela
     */
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.inputMode = 'numeric';
                input.pattern = '[1-9]';
                input.maxLength = 1;
                input.id = `cell-${row}-${col}`;
                
                if (this.initialBoard[row][col] !== 0) {
                    input.value = this.initialBoard[row][col];
                    cell.classList.add('locked');
                    input.disabled = true;
                } else {
                    input.value = '';
                }
                
                input.addEventListener('input', () => {
                    this.onCellChange(row, col);
                });

                input.addEventListener('focus', () => {
                    this.selectedCell.row = row;
                    this.selectedCell.col = col;
                    this.onCellFocus(row, col);
                    if (this.isMobile()) {
                        this.showNumpad();
                    }
                });

                input.addEventListener('paste', (e) => {
                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                    if (!/^[1-9]$/.test(pasted.trim())) {
                        e.preventDefault();
                    }
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        if (!this.gameActive) return;
                        input.value = '';
                        this.updateNumbersPanel();
                        this.saveProgress();
                    }
                });
                
                cell.appendChild(input);
                this.boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Renderizar painel de números 1-9
     */
    renderNumbersPanel() {
        this.numbersPanel.innerHTML = '';
        for (let num = 1; num <= 9; num++) {
            const numberBtn = document.createElement('div');
            numberBtn.className = 'number-item';
            numberBtn.textContent = num;
            numberBtn.id = `number-${num}`;
            numberBtn.setAttribute('data-number', num);
            numberBtn.addEventListener('click', () => this.onNumberClick(num));
            this.numbersPanel.appendChild(numberBtn);
        }
    }

    /**
     * Inserir número clicado no painel na célula atualmente selecionada
     */
    onNumberClick(num) {
        if (!this.gameActive) return;

        const { row, col } = this.selectedCell;
        if (row === null || col === null) return;

        const input = document.getElementById(`cell-${row}-${col}`);
        if (!input || input.disabled) return;

        input.value = String(num);
        this.onCellChange(row, col);
        input.focus();
    }

    /**
     * Atualizar painel de números (marcar completados com base nos números CORRETOS)
     */
    updateNumbersPanel() {
        for (let num = 1; num <= 9; num++) {
            const numberBtn = document.getElementById(`number-${num}`);
            if (!numberBtn) continue;
            const count = this.countCorrectNumberInBoard(num);
            
            if (count >= 9) {
                numberBtn.classList.add('completed');
                this.completedNumbers.add(num);
            } else {
                numberBtn.classList.remove('completed');
                this.completedNumbers.delete(num);
            }
        }
    }

    /**
     * Contar quantas vezes um número aparece CORRETAMENTE no tabuleiro
     */
    countCorrectNumberInBoard(num) {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                if (!input || !input.value) continue;
                const val = parseInt(input.value, 10);
                if (val === num && this.solvedBoard[row][col] === num) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Gerar uma chave simples para o puzzle baseado nos números iniciais
     */
    getPuzzleKey() {
        return this.initialBoard.map(r => r.join('')).join('|');
    }

    /**
     * Salvar progresso atual no localStorage (por puzzle)
     */
    saveProgress() {
        if (!this.gameActive) return;
        try {
            const key = 'sudoku-progress-' + this.getPuzzleKey();
            const state = {
                timeElapsed: this.timeElapsed,
                errorCount: this.errorCount,
                values: []
            };
            for (let row = 0; row < 9; row++) {
                state.values[row] = [];
                for (let col = 0; col < 9; col++) {
                    const input = document.getElementById(`cell-${row}-${col}`);
                    state.values[row][col] = input && input.value ? input.value : '';
                }
            }
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            console.warn('Falha ao salvar progresso:', e);
        }
    }

    /**
     * Limpar progresso salvo para o puzzle atual
     */
    clearProgress() {
        try {
            const key = 'sudoku-progress-' + this.getPuzzleKey();
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Falha ao limpar progresso:', e);
        }
    }

    /**
     * Carregar progresso salvo para o puzzle atual (se existir)
     */
    loadProgress() {
        try {
            const key = 'sudoku-progress-' + this.getPuzzleKey();
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            const state = JSON.parse(raw);

            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    const input = document.getElementById(`cell-${row}-${col}`);
                    if (input && !input.disabled) {
                        input.value = state.values && state.values[row]
                            ? state.values[row][col] || ''
                            : '';
                    }
                }
            }

            this.timeElapsed = state.timeElapsed || 0;
            this.errorCount = state.errorCount || 0;
            this.updateUI();
            this.updateNumbersPanel();
            return true;
        } catch (e) {
            console.warn('Falha ao carregar progresso:', e);
            return false;
        }
    }

    /**
     * Tenta restaurar progresso imediatamente após gerar puzzle
     */
    attemptRestoreProgress() {
        const restored = this.loadProgress();
        if (restored) {
            this.showMessage('Progresso recuperado!', 'success');
        }
    }

    /**
     * Exibir numpad (útil em mobile)
     */
    showNumpad() {
        const numpadSection = document.getElementById('numpadSection');
        if (!numpadSection) return;
        numpadSection.setAttribute('aria-hidden', 'false');
    }

    /**
     * Ocultar numpad
     */
    hideNumpad() {
        const numpadSection = document.getElementById('numpadSection');
        if (!numpadSection) return;
        numpadSection.setAttribute('aria-hidden', 'true');
    }

    /**
     * Verificar dispositivo/mobile (simples)
     */
    isMobile() {
        return ('ontouchstart' in window) || window.innerWidth <= 768;
    }

    /**
     * Handler para mudança de célula
     */
    onCellChange(row, col) {
        const input = document.getElementById(`cell-${row}-${col}`);
        if (!input) return;

        if (!this.gameActive || input.disabled) {
            return;
        }

        let value = input.value.trim();
        const cell = input.parentElement;
        cell.classList.remove('error', 'valid', 'highlight');

        if (value === '') {
            input.value = '';
            this.updateNumbersPanel();
            this.saveProgress();
            return;
        }

        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 9) {
            cell.classList.add('error');
            this.increaseErrorCount();
            setTimeout(() => {
                input.value = '';
                cell.classList.remove('error');
                this.updateNumbersPanel();
                this.saveProgress();
            }, 500);
            return;
        }

        // Validação contra a solução real
        if (!this.isValidNumber(row, col, num)) {
            cell.classList.add('error');
            this.increaseErrorCount();
            setTimeout(() => {
                input.value = '';
                cell.classList.remove('error');
                this.updateNumbersPanel();
                this.saveProgress();
            }, 500);
            return;
        }

        // Número correto
        cell.classList.add('valid');
        this.updateNumbersPanel();
        this.saveProgress();

        if (this.checkWin()) {
            this.gameActive = false;
            clearInterval(this.timerInterval);
            this.disableBoardInputs();
            this.hideNumpad();
            this.showMessage('🎉 Parabéns! Você resolveu o Sudoku!', 'success');
        }
    }

    /**
     * Handler para foco em célula (realça linha/coluna/bloco)
     */
    onCellFocus(row, col) {
        document.querySelectorAll('.sudoku-cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        const current = document.getElementById(`cell-${row}-${col}`);
        if (!current) return;

        current.parentElement.classList.add('highlight');
        
        for (let i = 0; i < 9; i++) {
            if (i !== col) {
                document.getElementById(`cell-${row}-${i}`).parentElement.classList.add('highlight');
            }
            if (i !== row) {
                document.getElementById(`cell-${i}-${col}`).parentElement.classList.add('highlight');
            }
        }
        
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        
        for (let i = blockRow; i < blockRow + 3; i++) {
            for (let j = blockCol; j < blockCol + 3; j++) {
                if (!(i === row && j === col)) {
                    document.getElementById(`cell-${i}-${j}`).parentElement.classList.add('highlight');
                }
            }
        }
    }

    /**
     * Validar se um número é válido para uma posição (contra a solução)
     */
    isValidNumber(row, col, num) {
        return this.solvedBoard[row][col] === num;
    }

    /**
     * Verificar se o jogo foi vencido (todas as células iguais à solução)
     */
    checkWin() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                const value = input && input.value ? parseInt(input.value, 10) : 0;
                if (!value || value !== this.solvedBoard[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Desabilitar todas as células editáveis
     */
    disableBoardInputs() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                if (input && !input.disabled) {
                    input.disabled = true;
                }
            }
        }
    }

    /**
     * Resolver o tabuleiro
     */
    solve() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                if (!input) continue;
                if (!input.disabled) {
                    input.value = this.solvedBoard[row][col];
                    input.parentElement.classList.add('valid');
                }
            }
        }
        
        this.gameActive = false;
        clearInterval(this.timerInterval);
        this.updateNumbersPanel();
        this.saveProgress();
        this.disableBoardInputs();
        this.hideNumpad();
        this.showMessage('Tabuleiro resolvido!', 'warning');
    }

    /**
     * Reiniciar o jogo (mesmo puzzle, zerando tempo e erros)
     */
    reset() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                if (!input) continue;
                if (!input.disabled) {
                    input.value = '';
                    input.disabled = false;
                }
                input.parentElement.classList.remove('error', 'valid', 'highlight');
            }
        }

        this.errorCount = 0;
        this.timeElapsed = 0;
        this.gameActive = true;
        this.completedNumbers.clear();
        clearInterval(this.timerInterval);
        this.clearProgress();
        this.updateUI();
        this.updateNumbersPanel();
        this.startTimer();
        
        this.showMessage('Tabuleiro reiniciado!', 'warning');
    }

    /**
     * Limpar tudo e começar novo jogo
     */
    clear() {
        this.newGame();
    }

    /**
     * Incrementar contador de erros
     */
    increaseErrorCount() {
        this.errorCount++;
        this.updateUI();
        
        if (this.errorCount >= this.maxErrors) {
            this.gameActive = false;
            clearInterval(this.timerInterval);
            this.disableBoardInputs();
            this.hideNumpad();
            this.showMessage('❌ Limite de erros atingido! Jogo encerrado.', 'error');
        }
    }

    /**
     * Iniciar timer
     */
    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateUI();
        }, 1000);
    }

    /**
     * Atualizar UI (timer, dificuldade, erros)
     */
    updateUI() {
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const difficultyMap = {
            easy: 'Fácil',
            medium: 'Médio',
            hard: 'Difícil'
        };
        this.difficultyElement.textContent = difficultyMap[this.difficulty] || this.difficulty;
        
        this.errorsElement.textContent = `${this.errorCount}/${this.maxErrors}`;
    }

    /**
     * Mostrar mensagem na tela
     */
    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
        
        setTimeout(() => {
            this.messageElement.className = 'message';
        }, 4000);
    }

    /**
     * Embaralhar array
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

/* ==========================================
   INICIALIZAR JOGO QUANDO DOM ESTIVER PRONTO
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    new Sudoku();
});
