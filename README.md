# Sudoku Game - README

Um jogo de Sudoku completo, funcional e elegante. Totalmente desenvolvido em HTML5, CSS3 e JavaScript puro - sem dependências externas!

## 🎮 Características

✨ **Interface Moderna e Responsiva**
- Design limpo e intuitivo
- Funciona perfeitamente em desktop e mobile
- Animações suaves e feedback visual
- Numpad visual para entrada em touch/mobile

🎯 **Gameplay Completo**
- Tabuleiro 9x9 com regiões 3x3 visuais
- 3 níveis de dificuldade (Fácil, Médio, Difícil)
- Validação em tempo real de números
- Sistema de erros (máximo 5 erros)
- Timer para acompanhar o tempo de jogo
- Painel com números 1-9 mostrando quais já foram completados

🚀 **Funcionalidades**
- Gerador de puzzles randômicos com algoritmo backtracking
- Entrada de números por teclado, clique no painel 1-9 ou numpad visual
- Destaque automático de linha, coluna e bloco ao selecionar célula
- Painel de números disponíveis com marcação visual dos completados
- Salva progresso automaticamente no localStorage por puzzle
- Restaura progresso anterior ao carregar puzzle duplicado
- Botão para resolver o tabuleiro
- Opção de reiniciar ou começar novo jogo
- Mensagens de feedback visual
- Detecção automática de vitória

💻 **Tecnologia**
- HTML5 semântico
- CSS3 com Grid e Flexbox
- JavaScript vanilla (sem frameworks)
- LocalStorage para persistência de progresso
- Totalmente preparado para GitHub Pages

## 🚀 Como Usar

### Local
1. Clone ou baixe este repositório
2. Abra o arquivo `index.html` em um navegador
3. Comece a jogar!

### GitHub Pages
1. Faça fork ou clone este repositório
2. Vá para Settings → Pages
3. Selecione "Deploy from a branch"
4. Escolha a branch `main` e salve
5. Acesse `https://seu-usuario.github.io/Sudoku`

## 📋 Como Jogar

1. **Objetivo**: Preencha o tabuleiro 9x9 com números de 1 a 9
2. **Regras**:
   - Cada linha deve conter os números 1-9 uma única vez
   - Cada coluna deve conter os números 1-9 uma única vez
   - Cada bloco 3x3 deve conter os números 1-9 uma única vez
3. **Validação**: Números inválidos aparecem em vermelho automaticamente
4. **Dificuldade**: Escolha entre Fácil (40 células), Médio (50) ou Difícil (60)

## 🎛️ Botões Disponíveis

- **Novo Jogo**: Gera um novo puzzle com o nível selecionado
- **Resolver**: Mostra a solução do puzzle
- **Reiniciar**: Limpa apenas suas respostas, mantém as células pré-preenchidas
- **Limpar**: Alias para "Novo Jogo"

## 📂 Estrutura do Projeto

```
Sudoku/
├── index.html       # Estrutura HTML
├── styles.css       # Estilos CSS
├── script.js        # Lógica JavaScript
└── README.md        # Este arquivo
```

## 🔧 Características Técnicas

### Validação em Tempo Real
Conforme você digita números, o jogo valida automaticamente:
- Se o número já existe na linha/coluna/bloco → vermelho
- Se o número é válido → verde
- Limite de 5 erros antes de game over
- Bloqueio de paste com conteúdo inválido
- Aceita entrada apenas de números 1-9

### Entrada de Números (Múltiplos Métodos)
- **Teclado físico**: Digite 1-9 (sem spinners/setas)
- **Painel 1-9**: Clique em um número para inserir na célula selecionada
- **Numpad visual**: Teclado visual automaticamente exibido em dispositivos mobile/touch
- **Teclado nativo mobile**: `inputmode="numeric"` exibe numpad nativo do sistema

### Painel de Números Disponíveis
- Mostra os 9 dígitos abaixo do tabuleiro
- Cada número fica marcado quando completado (9 ocorrências)
- Números completados ficam verdes com estilo diferente (indicando "não precisa mais")
- Atualiza em tempo real conforme números são preenchidos

### Gerador de Puzzles
- Algoritmo backtracking para criar tabuleiros válidos
- Remove números baseado no nível de dificuldade
- Cada jogo é único
- Garante solução única para cada puzzle

### Persistência de Progresso
- Salva automaticamente o progresso no localStorage
- Uma chave de storage por puzzle (baseada nos números iniciais)
- Restaura progresso anterior quando o mesmo puzzle é gerado novamente
- Sincroniza tempo decorrido e contador de erros
- Funciona completamente offline

### Responsividade
- Grid CSS adaptável para mobile
- Touch-friendly em dispositivos móveis
- Numpad visual aparece automaticamente em telas pequenas (<769px)
- Suporte completo a diferentes tamanhos de tela
- Layout se adapta de forma elegante (desktop → tablet → mobile)

## 🌐 Browser Support

✅ Chrome/Chromium (88+)
✅ Firefox (87+)
✅ Safari (14+)
✅ Edge (88+)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Notas de Desenvolvimento

- Código bem comentado em português
- Estruturado em classes modernas (ES6)
- Sem dependências externas
- Pronto para produção

## 🎨 Customizações Possíveis

Você pode facilmente customizar:

**Cores**: Edite as cores no CSS
```css
--primary-color: #667eea;
--secondary-color: #764ba2;
```

**Dificuldade**: Ajuste `getCellsToRemove()` em `script.js`
```javascript
const difficultyMap = {
    easy: 40,
    medium: 50,
    hard: 60
};
```

**Erros Permitidos**: Mude `this.maxErrors` em `script.js`
```javascript
this.maxErrors = 5; // Mude para o número desejado
```

## 📄 Licença

Este projeto é open source e está disponível para uso livre.

## 💡 Dicas

1. Clique em uma célula para destacar sua linha, coluna e bloco
2. Use a seleção de dificuldade antes de começar um novo jogo
3. O timer continuará rodando até você resolver ou atingir o limite de erros
4. Você pode voltar quantas vezes quiser ao pressionar "Novo Jogo"
5. Em dispositivos mobile, o numpad aparece automaticamente ao focar uma célula
6. Seu progresso é salvo automaticamente — você pode sair e voltar depois
7. O painel 1-9 abaixo mostra quais números já foram completados (com estilo diferente)

## 🎓 Recursos para Desenvolvimento

### Salvar Progresso
O progresso é salvo automaticamente no localStorage. Para customizar:
```javascript
// Acessar a chave de um puzzle
const key = 'sudoku-progress-' + this.getPuzzleKey();

// Estrutura salva
{
  timeElapsed: 123,      // segundos
  errorCount: 2,         // erros cometidos
  values: [              // valores das células preenchidas
    ['1', '', '3', ...],
    ...
  ]
}
```

### Métodos Úteis para Customização
```javascript
// Salvar manualmente
game.saveProgress();

// Carregar progresso
game.loadProgress();

// Mostrar/ocultar numpad
game.showNumpad();
game.hideNumpad();

// Verificar se é dispositivo mobile
if (game.isMobile()) { /* ... */ }
```

## 🚀 Deployment no GitHub Pages

Este projeto está 100% pronto para GitHub Pages:
- ✅ Sem código server-side
- ✅ Caminhos relativos corretos
- ✅ Sem dependências externas
- ✅ Funciona com branch automática (gh-pages)

Basta fazer push e ativar Pages nas configurações do repositório!

---

Desenvolvido com ❤️ para web developers apaixonados por games!
