
    (function() {
      'use strict';

      // ========== 変数定義 ==========
      let currentInput = '0';
      let previousInput = '';
      let operator = '';
      let shouldResetDisplay = false;
      let expression = '';
      let history = [];

      // ========== DOM要素 ==========
      const mainDisplay = document.getElementById('mainDisplay');
      const subDisplay = document.getElementById('subDisplay');
      const historyList = document.getElementById('historyList');
      const clearHistoryBtn = document.getElementById('clearHistoryBtn');

      // ========== ユーティリティ関数 ==========
      function getOperatorSymbol(op) {
        const symbols = {'+': '+', '-': '−', '*': '×', '/': '÷', '%': '%'};
        return symbols[op] || op;
      }

      function updateDisplay() {
        mainDisplay.textContent = currentInput;
        subDisplay.textContent = expression;
      }

      // ========== 計算ロジック ==========
      function inputNumber(num) {
        if (shouldResetDisplay) {
          currentInput = num;
          expression = num;
          shouldResetDisplay = false;
        } else {
          if (currentInput === '0' && num !== '.') {
            currentInput = num;
            expression = expression.replace(/0$/, num);
          } else if (num === '.' && currentInput.includes('.')) {
            return;
          } else {
            currentInput += num;
            expression += num;
          }
        }
        updateDisplay();
      }

      function inputOperator(op) {
        if (operator && !shouldResetDisplay && previousInput) {
          calculate();
        }
        operator = op;
        previousInput = currentInput;
        shouldResetDisplay = true;
        expression += ' ' + getOperatorSymbol(op) + ' ';
        updateDisplay();
      }

      function calculate() {
        if (!operator || shouldResetDisplay || !previousInput) return;
        
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        let result;

        switch(operator) {
          case '+': result = prev + current; break;
          case '-': result = prev - current; break;
          case '*': result = prev * current; break;
          case '/': result = prev / current; break;
          case '%': result = prev % current; break;
        }

        const roundedResult = Math.round(result * 100000000) / 100000000;
        const fullExpression = expression;
        
        addToHistory(fullExpression, roundedResult);

        currentInput = String(roundedResult);
        expression = String(roundedResult);
        operator = '';
        previousInput = '';
        shouldResetDisplay = true;
        updateDisplay();
      }

      function clearAll() {
        currentInput = '0';
        previousInput = '';
        operator = '';
        expression = '0';
        shouldResetDisplay = false;
        updateDisplay();
      }

      function deleteLast() {
        if (shouldResetDisplay) return;
        
        if (currentInput.length > 1) {
          currentInput = currentInput.slice(0, -1);
          expression = expression.slice(0, -1);
        } else {
          currentInput = '0';
          expression = expression.slice(0, -1) + '0';
        }
        updateDisplay();
      }

      // ========== 履歴機能 ==========
      async function addToHistory(expr, result) {
        const historyItem = {
          expression: expr,
          result: result,
          timestamp: Date.now()
        };
        
        history.unshift(historyItem);
        if (history.length > 50) {
          history = history.slice(0, 50);
        }
        
        await saveHistory();
        renderHistory();
      }

      function renderHistory() {
        if (history.length === 0) {
          historyList.innerHTML = '<div class="history-empty">履歴がありません</div>';
          return;
        }

        historyList.innerHTML = history.map((item, index) => `
          <div class="history-item" data-history-index="${index}">
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">= ${item.result}</div>
          </div>
        `).join('');
      }

      function loadFromHistory(index) {
        const item = history[index];
        currentInput = String(item.result);
        expression = String(item.result);
        previousInput = '';
        operator = '';
        shouldResetDisplay = true;
        updateDisplay();
      }

      async function clearHistory() {
        if (history.length === 0) return;
        if (confirm('履歴をすべて削除しますか?')) {
          history = [];
          await saveHistory();
          renderHistory();
        }
      }

      async function saveHistory() {
        try {
          await window.storage.set('calculator-history', JSON.stringify(history));
        } catch (error) {
          console.log('履歴の保存に失敗しました');
        }
      }

      async function loadHistory() {
        try {
          const result = await window.storage.get('calculator-history');
          if (result && result.value) {
            history = JSON.parse(result.value);
            renderHistory();
          }
        } catch (error) {
          console.log('履歴の読み込みに失敗しました');
        }
      }

      // ========== イベントリスナー ==========
      document.querySelector('.calc-buttons').addEventListener('click', (e) => {
        const btn = e.target.closest('.calc-btn');
        if (!btn) return;

        if (btn.dataset.number) {
          inputNumber(btn.dataset.number);
        } else if (btn.dataset.operator) {
          inputOperator(btn.dataset.operator);
        } else if (btn.dataset.action === 'clear') {
          clearAll();
        } else if (btn.dataset.action === 'delete') {
          deleteLast();
        } else if (btn.dataset.action === 'equals') {
          calculate();
        }
      });

      historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;
        const index = parseInt(item.dataset.historyIndex);
        loadFromHistory(index);
      });

      clearHistoryBtn.addEventListener('click', clearHistory);

      // ========== 初期化 ==========
      updateDisplay();
      loadHistory();
    })();