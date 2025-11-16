/* ==========================================
   CLASSE SUDOKU - LÓGICA DO JOGO
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
        this.newGame();
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

                if (val === 'clear') {
                    // limpar célula selecionada
                    const { row, col } = this.selectedCell;
                    if (row !== null && col !== null) {
                        const input = document.getElementById(`cell-${row}-${col}`);
                        if (input && !input.disabled) {
                            input.value = '';
                            this.onCellChange(row, col);
                        }
                    }
                } else if (val === 'back') {
                    const { row, col } = this.selectedCell;
                    if (row !== null && col !== null) {
                        const input = document.getElementById(`cell-${row}-${col}`);
                        if (input && !input.disabled) {
                            input.value = '';
                            this.onCellChange(row, col);
                        }
                    }
                } else {
                    // número normal
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
        
        // Tentar restaurar progresso salvo para esse puzzle
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
                    // Obter números que podem ser colocados
                    const validNumbers = this.getValidNumbers(board, row, col);
                    
                    // Embaralhar números
                    this.shuffle(validNumbers);
                    
                    // Tentar colocar cada número
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
     * Validar se um número pode ser colocado em uma posição
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
                // usar text + inputmode para evitar spinners e ter controle total
                input.type = 'text';
                input.inputMode = 'numeric';
                input.pattern = '[1-9]';
                input.maxLength = 1;
                input.id = `cell-${row}-${col}`;
                
                // Se célula tem número pré-preenchido (inicial)
                if (this.initialBoard[row][col] !== 0) {
                    input.value = this.initialBoard[row][col];
                    cell.classList.add('locked');
                    input.disabled = true;
                } else {
                    input.value = '';
                }
                
                // Event listeners para validação e entrada imediata
                input.addEventListener('input', () => {
                    this.onCellChange(row, col);
                });

                input.addEventListener('focus', () => {
                    this.selectedCell.row = row;
                    this.selectedCell.col = col;
                    this.onCellFocus(row, col);
                    // Mostrar numpad em dispositivos touch/small
                    if (this.isMobile()) {
                        this.showNumpad();
                    }
                });

                // Prevenir colar de conteúdo inválido
                input.addEventListener('paste', (e) => {
                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                    if (!/^[1-9]$/.test(pasted.trim())) {
                        e.preventDefault();
                    }
                });

                // Permitir limpar com Backspace/Delete
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        // limpar valor e atualizar painel
                        input.value = '';
                        this.updateNumbersPanel();
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
            
            // Ao clicar no número, inserir na célula selecionada
            numberBtn.addEventListener('click', () => this.onNumberClick(num));

            this.numbersPanel.appendChild(numberBtn);
        }
    }

    /**
     * Inserir número clicado no painel na célula atualmente selecionada
     */
    onNumberClick(num) {
        const { row, col } = this.selectedCell;
        if (row === null || col === null) return; // sem célula selecionada

        const input = document.getElementById(`cell-${row}-${col}`);
        if (!input || input.disabled) return;

        // Simular entrada e validar
        input.value = String(num);
        this.onCellChange(row, col);
        input.focus();
    }

    /**
     * Atualizar painel de números (desabilitar os completados)
     */
    updateNumbersPanel() {
        for (let num = 1; num <= 9; num++) {
            const numberBtn = document.getElementById(`number-${num}`);
            const count = this.countNumberInBoard(num);
            
            if (count >= 9) {
                numberBtn.classList.add('completed');
                this.completedNumbers.add(num);
            } else {
                numberBtn.classList.remove('completed');
            }
        }
    }

    /**
     * Gerar uma chave simples para o puzzle baseado nos números iniciais
     */
    getPuzzleKey() {
        // chave simples: concatenação das linhas iniciais
        return this.initialBoard.map(r => r.join('')).join('|');
    }

    /**
     * Salvar progresso atual no localStorage (por puzzle)
     */
    saveProgress() {
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
            // falhar silenciosamente
            console.warn('Falha ao salvar progresso:', e);
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
            // aplicar valores
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    const input = document.getElementById(`cell-${row}-${col}`);
                    if (input && !input.disabled) {
                        input.value = state.values && state.values[row] ? state.values[row][col] || '' : '';
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
     * Contar quantas vezes um número aparece no tabuleiro
     */
    countNumberInBoard(num) {
        let count = 0;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                if (input.value && parseInt(input.value) === num) {
                    count++;
                }
            }
        }
        
        return count;
    }

    /**
     * Handler para mudança de célula
     */
    onCellChange(row, col) {
        const input = document.getElementById(`cell-${row}-${col}`);
        const value = input.value ? parseInt(input.value) : 0;
        
        // Remover classes anteriores
        const cell = input.parentElement;
        cell.classList.remove('error', 'valid', 'highlight');
        
        // Se célula está vazia, apenas retornar
        if (value === 0 || value === '') {
            input.value = '';
            this.updateNumbersPanel();
            this.saveProgress();
            return;
        }
        
        // Validar número
        if (value < 1 || value > 9 || isNaN(value)) {
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
        
        // Verificar se número é válido para essa posição
        if (!this.isValidNumber(row, col, value)) {
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
        
        // Número válido
        cell.classList.add('valid');
        
        // Atualizar painel de números
        this.updateNumbersPanel();
        this.saveProgress();
        
        // Verificar se jogo foi vencido
        if (this.checkWin()) {
            this.gameActive = false;
            clearInterval(this.timerInterval);
            this.showMessage('🎉 Parabéns! Você resolveu o Sudoku!', 'success');
        }
    }

    /**
     * Handler para foco em célula
     */
    onCellFocus(row, col) {
        // Remover highlight anterior
        document.querySelectorAll('.sudoku-cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        // Destacar célula atual
        document.getElementById(`cell-${row}-${col}`).parentElement.classList.add('highlight');
        
        // Destacar outras células na mesma linha, coluna e bloco
        for (let i = 0; i < 9; i++) {
            // Linha
            if (i !== col) {
                document.getElementById(`cell-${row}-${i}`).parentElement.classList.add('highlight');
            }
            
            // Coluna
            if (i !== row) {
                document.getElementById(`cell-${i}-${col}`).parentElement.classList.add('highlight');
            }
        }
        
        // Bloco 3x3
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        
        for (let i = blockRow; i < blockRow + 3; i++) {
            for (let j = blockCol; j < blockCol + 3; j++) {
                if (i !== row || j !== col) {
                    document.getElementById(`cell-${i}-${j}`).parentElement.classList.add('highlight');
                }
            }
        }
    }

    /**
     * Validar se um número é válido para uma posição
     */
    isValidNumber(row, col, num) {
        // Verificar linha
        for (let i = 0; i < 9; i++) {
            if (i !== col) {
                const input = document.getElementById(`cell-${row}-${i}`);
                if (input.value && parseInt(input.value) === num) {
                    return false;
                }
            }
        }
        
        // Verificar coluna
        for (let i = 0; i < 9; i++) {
            if (i !== row) {
                const input = document.getElementById(`cell-${i}-${col}`);
                if (input.value && parseInt(input.value) === num) {
                    return false;
                }
            }
        }
        
        // Verificar bloco 3x3
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        
        for (let i = blockRow; i < blockRow + 3; i++) {
            for (let j = blockCol; j < blockCol + 3; j++) {
                if ((i !== row || j !== col)) {
                    const input = document.getElementById(`cell-${i}-${j}`);
                    if (input.value && parseInt(input.value) === num) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * Verificar se o jogo foi vencido
     */
    checkWin() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                const value = input.value ? parseInt(input.value) : 0;
                
                // Se célula está vazia
                if (value === 0) return false;
                
                // Verificar validade do número
                if (!this.isValidNumberFinal(row, col, value)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Validar número final (verificação mais rigorosa)
     */
    isValidNumberFinal(row, col, num) {
        // Verificar linha
        for (let i = 0; i < 9; i++) {
            if (i !== col) {
                const input = document.getElementById(`cell-${row}-${i}`);
                if (input.value && parseInt(input.value) === num) {
                    return false;
                }
            }
        }
        
        // Verificar coluna
        for (let i = 0; i < 9; i++) {
            if (i !== row) {
                const input = document.getElementById(`cell-${i}-${col}`);
                if (input.value && parseInt(input.value) === num) {
                    return false;
                }
            }
        }
        
        // Verificar bloco 3x3
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        
        for (let i = blockRow; i < blockRow + 3; i++) {
            for (let j = blockCol; j < blockCol + 3; j++) {
                if ((i !== row || j !== col)) {
                    const input = document.getElementById(`cell-${i}-${j}`);
                    if (input.value && parseInt(input.value) === num) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * Resolver o tabuleiro
     */
    solve() {
        // Preencher todas as células com a solução
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                
                // Se célula não está bloqueada
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
        this.showMessage('Tabuleiro resolvido!', 'warning');
    }

    /**
     * Reiniciar o jogo (limpar preenchimentos)
     */
    reset() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = document.getElementById(`cell-${row}-${col}`);
                
                // Se célula não está bloqueada, limpar
                if (!input.disabled) {
                    input.value = '';
                    input.parentElement.classList.remove('error', 'valid', 'highlight');
                }
            }
        }
        
        this.updateNumbersPanel();
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
        // Atualizar timer
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Atualizar dificuldade
        const difficultyMap = {
            easy: 'Fácil',
            medium: 'Médio',
            hard: 'Difícil'
        };
        this.difficultyElement.textContent = difficultyMap[this.difficulty];
        
        // Atualizar erros
        this.errorsElement.textContent = `${this.errorCount}/${this.maxErrors}`;
    }

    /**
     * Mostrar mensagem na tela
     */
    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
        
        // Remover mensagem após 4 segundos
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
