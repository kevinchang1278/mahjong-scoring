// 遊戲狀態
let gameState = {
    players: [],
    baseScore: 100,
    taiScore: 100,
    history: []
};

// DOM 元素
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const baseScoreInput = document.getElementById('baseScore');
const taiScoreInput = document.getElementById('taiScore');
const huButton = document.getElementById('huButton');
const zimoButton = document.getElementById('zimoButton');
const exportButton = document.getElementById('exportButton');
const huModal = document.getElementById('huModal');
const zimoModal = document.getElementById('zimoModal');
const editScoreModal = document.getElementById('editScoreModal');
const editPlayerName = document.getElementById('editPlayerName');
const newScoreInput = document.getElementById('newScore');

// 初始化遊戲
function initGame() {
    // 初始化玩家
    gameState.players = Array.from(document.querySelectorAll('.player')).map((player, index) => ({
        name: player.querySelector('.player-name').value,
        score: 0,
        element: player,
        editButton: player.querySelector('.edit-score-btn')
    }));

    // 設置底分和台分
    gameState.baseScore = parseInt(baseScoreInput.value);
    gameState.taiScore = parseInt(taiScoreInput.value);

    // 更新顯示
    updateScores();
    
    // 綁定編輯分數按鈕事件
    bindEditScoreEvents();
}

// 更新分數顯示
function updateScores() {
    gameState.players.forEach(player => {
        player.element.querySelector('.score').textContent = player.score;
    });
}

// 顯示模態框
function showModal(modal) {
    modal.classList.remove('hidden');
    
    // 清空並重新創建所有玩家按鈕
    const allPlayerButtons = modal.querySelectorAll('.player-buttons');
    allPlayerButtons.forEach(buttonsContainer => {
        buttonsContainer.innerHTML = '';
        
        gameState.players.forEach((player, index) => {
            const button = document.createElement('button');
            button.textContent = player.name;
            button.dataset.index = index;
            button.addEventListener('click', () => {
                // 只清除同一容器中的其他按鈕的選中狀態
                buttonsContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                // 如果是胡牌模態框，且點擊的是贏家選擇區域
                if (modal === huModal && buttonsContainer.closest('.winner-selection')) {
                    const winnerIndex = parseInt(button.dataset.index);
                    // 在放槍區域禁用贏家按鈕
                    const loserButtons = huModal.querySelector('.loser-selection .player-buttons');
                    loserButtons.querySelectorAll('button').forEach(btn => {
                        if (parseInt(btn.dataset.index) === winnerIndex) {
                            btn.disabled = true;
                            btn.style.opacity = '0.5';
                        } else {
                            btn.disabled = false;
                            btn.style.opacity = '1';
                        }
                    });
                }
            });
            buttonsContainer.appendChild(button);
        });
    });
}

// 隱藏模態框
function hideModal(modal) {
    modal.classList.add('hidden');
}

// 綁定編輯分數按鈕事件
function bindEditScoreEvents() {
    gameState.players.forEach((player, index) => {
        player.editButton.addEventListener('click', () => {
            showEditScoreModal(index);
        });
    });
}

// 顯示編輯分數模態框
function showEditScoreModal(playerIndex) {
    const player = gameState.players[playerIndex];
    editPlayerName.textContent = player.name;
    newScoreInput.value = player.score;
    editScoreModal.dataset.playerIndex = playerIndex;
    showModal(editScoreModal);
    newScoreInput.focus();
    newScoreInput.select();
    
    // 添加鍵盤事件監聽
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirmEditScore').click();
        } else if (e.key === 'Escape') {
            document.getElementById('cancelEditScore').click();
        }
    };
    
    newScoreInput.addEventListener('keydown', handleKeyPress);
    
    // 清理事件監聽器
    editScoreModal.addEventListener('hidden', () => {
        newScoreInput.removeEventListener('keydown', handleKeyPress);
    }, { once: true });
}

// 計算胡牌分數
function calculateHuScore(tai) {
    return gameState.baseScore + (tai * gameState.taiScore);
}

// 計算自摸分數
function calculateZimoScore(tai) {
    const baseScore = gameState.baseScore + (tai * gameState.taiScore);
    return baseScore * 3;
}

// 記錄遊戲歷史
function recordHistory(type, winner, loser, tai, score) {
    const record = {
        type,
        winner: gameState.players[winner].name,
        loser: loser !== undefined ? gameState.players[loser].name : null,
        tai,
        score,
        timestamp: new Date().toLocaleString()
    };
    
    // 如果是手動編輯，添加額外信息
    if (type === '手動編輯') {
        record.description = `分數從 ${gameState.players[winner].score - score} 變更為 ${gameState.players[winner].score}`;
    }
    
    gameState.history.push(record);
}

// 導出Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();
    
    // 創建分數表
    const scoresData = [
        ['玩家', '分數'],
        ...gameState.players.map(player => [player.name, player.score])
    ];
    const scoresSheet = XLSX.utils.aoa_to_sheet(scoresData);
    XLSX.utils.book_append_sheet(wb, scoresSheet, '分數');

    // 創建歷史記錄表
    const historyData = [
        ['時間', '類型', '贏家', '輸家', '台數', '分數', '備註'],
        ...gameState.history.map(record => [
            record.timestamp,
            record.type,
            record.winner,
            record.loser || '',
            record.tai,
            record.score,
            record.description || ''
        ])
    ];
    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, historySheet, '歷史記錄');

    // 導出文件
    XLSX.writeFile(wb, '麻將計分.xlsx');
}

// 事件監聽器
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initGame();
});

huButton.addEventListener('click', () => {
    showModal(huModal);
});

zimoButton.addEventListener('click', () => {
    showModal(zimoModal);
});

document.getElementById('confirmHu').addEventListener('click', () => {
    const winnerButton = huModal.querySelector('.winner-selection .player-buttons .selected');
    const loserButton = huModal.querySelector('.loser-selection .player-buttons .selected');
    const tai = parseInt(document.getElementById('huTai').value);

    if (winnerButton && loserButton && !isNaN(tai)) {
        const winnerIndex = parseInt(winnerButton.dataset.index);
        const loserIndex = parseInt(loserButton.dataset.index);
        const score = calculateHuScore(tai);

        gameState.players[winnerIndex].score += score;
        gameState.players[loserIndex].score -= score;

        recordHistory('胡牌', winnerIndex, loserIndex, tai, score);
        updateScores();
        hideModal(huModal);
    }
});

document.getElementById('confirmZimo').addEventListener('click', () => {
    const winnerButton = zimoModal.querySelector('.winner-selection .player-buttons .selected');
    const tai = parseInt(document.getElementById('zimoTai').value);

    if (winnerButton && !isNaN(tai)) {
        const winnerIndex = parseInt(winnerButton.dataset.index);
        const score = calculateZimoScore(tai);

        gameState.players[winnerIndex].score += score;
        gameState.players.forEach((player, index) => {
            if (index !== winnerIndex) {
                player.score -= score / 3;
            }
        });

        recordHistory('自摸', winnerIndex, undefined, tai, score);
        updateScores();
        hideModal(zimoModal);
    }
});

document.getElementById('cancelHu').addEventListener('click', () => {
    hideModal(huModal);
});

document.getElementById('cancelZimo').addEventListener('click', () => {
    hideModal(zimoModal);
});

// 編輯分數事件監聽器
document.getElementById('confirmEditScore').addEventListener('click', () => {
    const playerIndex = parseInt(editScoreModal.dataset.playerIndex);
    const newScore = parseInt(newScoreInput.value);
    
    if (!isNaN(newScore)) {
        const oldScore = gameState.players[playerIndex].score;
        gameState.players[playerIndex].score = newScore;
        
        // 記錄分數變更歷史
        recordHistory('手動編輯', playerIndex, undefined, 0, newScore - oldScore);
        
        updateScores();
        hideModal(editScoreModal);
    }
});

document.getElementById('cancelEditScore').addEventListener('click', () => {
    hideModal(editScoreModal);
});

exportButton.addEventListener('click', exportToExcel);

// 監聽玩家名稱變化
document.querySelectorAll('.player-name').forEach(input => {
    input.addEventListener('change', () => {
        const index = Array.from(document.querySelectorAll('.player')).indexOf(input.closest('.player'));
        gameState.players[index].name = input.value;
    });
});

// 監聽底分和台分變化
baseScoreInput.addEventListener('change', () => {
    gameState.baseScore = parseInt(baseScoreInput.value);
});

taiScoreInput.addEventListener('change', () => {
    gameState.taiScore = parseInt(taiScoreInput.value);
}); 