document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const messageTextElement = document.getElementById('message-text');
    const choicesAreaElement = document.getElementById('choices-area');
    const feedbackTextElement = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizAreaElement = document.getElementById('quiz-area');
    const resultAreaElement = document.getElementById('result-area');
    const restartBtn = document.getElementById('restart-btn');
    const progressBarElement = document.getElementById('progress-bar');
    const progressTextElement = document.getElementById('progress-text');

    // 結果表示用要素
    const resultIconContainer = document.getElementById('result-icon-container');
    const resultRankTitleElement = document.getElementById('result-rank-title');
    const finalScoreValueElement = document.getElementById('final-score-value');
    const totalQuestionsOnResultElement = document.getElementById('total-questions-on-result');
    const resultMessageElement = document.getElementById('result-message');
    
    const appContainer = document.querySelector('.app-container');

    let allQuizData = []; 
    let currentQuizSet = []; 
    let currentQuestionIndex = 0;
    let score = 0;
    const TARGET_NUM_QUESTIONS = 10; 

    // --- 初期化処理 ---
    async function initializeQuiz() {
        // アプリコンテナのフェードインアニメーション用クラス付与
        if(appContainer) { // 遅延させてアニメーションが目立つように
            setTimeout(() => appContainer.style.opacity = '1', 100);
        }

        try {
            const response = await fetch('quiz_data.json');
            if (!response.ok) throw new Error(`HTTP error! Quiz data not found. Status: ${response.status}`);
            allQuizData = await response.json(); 
            
            if (!Array.isArray(allQuizData) || allQuizData.length === 0) {
                displayError("クイズデータが見つからないか、形式が正しくありません。");
                return;
            }
            prepareNewQuizSet(); 
            startGame();
        } catch (error) {
            console.error("クイズデータの読み込みまたは初期化に失敗:", error);
            displayError(`クイズの読み込みに失敗しました: ${error.message}`);
        }
    }

    function prepareNewQuizSet() {
        let shuffledData = shuffleArray([...allQuizData]); 
        currentQuizSet = shuffledData.slice(0, TARGET_NUM_QUESTIONS); 
        // データが10問未満の場合、あるだけの問題数でセットされる
        if (currentQuizSet.length === 0 && allQuizData.length > 0) {
             currentQuizSet = shuffledData.slice(0, allQuizData.length); 
        }
    }
    
    function displayError(message) { 
        quizAreaElement.innerHTML = `<p class="error-message">${message}</p>`;
        quizAreaElement.style.display = 'block';
        resultAreaElement.style.display = 'none';
        const header = document.querySelector('.quiz-header');
        if(header) header.style.display = 'none';
    }

    // --- クイズ進行 ---
    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        
        // 結果表示エリアのアニメーションリセット
        resultAreaElement.style.display = 'none';
        const resultCard = document.querySelector('.result-card');
        if(resultCard) {
            resultCard.style.opacity = '0';
            resultCard.style.transform = 'perspective(1000px) rotateY(-10deg) scale(0.95)';
        }
        
        quizAreaElement.style.display = 'block';
        nextQuestionBtn.style.display = 'none';
        feedbackTextElement.textContent = '';
        feedbackTextElement.className = 'feedback-text'; // 可視化クラス除去
        
        if (currentQuizSet.length === 0) {
            displayError("出題できるクイズがありません。トーク履歴を確認してください。");
            return;
        }
        
        updateProgress();
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex < currentQuizSet.length) {
            const currentQuestion = currentQuizSet[currentQuestionIndex];
            messageTextElement.innerHTML = currentQuestion.message.replace(/\n/g, '<br>');
            choicesAreaElement.innerHTML = ''; 

            currentQuestion.choices.forEach(choice => {
                const button = document.createElement('button');
                button.textContent = choice;
                button.addEventListener('click', () => handleAnswer(choice, currentQuestion.answer));
                choicesAreaElement.appendChild(button);
            });
            feedbackTextElement.textContent = '';
            feedbackTextElement.className = 'feedback-text'; // リセット
            nextQuestionBtn.style.display = 'none';
        } else {
            showResults();
        }
    }

    function handleAnswer(selectedChoice, correctAnswer) {
        const buttons = choicesAreaElement.getElementsByTagName('button');
        let selectedButtonElement = null;

        for (let btn of buttons) {
            btn.disabled = true;
            if (btn.textContent === selectedChoice) selectedButtonElement = btn;
            if (btn.textContent === correctAnswer) btn.classList.add('reveal-correct');
        }
        
        feedbackTextElement.classList.add('visible'); // フィードバック表示

        if (selectedChoice === correctAnswer) {
            score++;
            feedbackTextElement.textContent = "正解！🎉";
            feedbackTextElement.classList.add('correct');
            if (selectedButtonElement) {
                selectedButtonElement.classList.remove('reveal-correct');
                selectedButtonElement.classList.add('correct');
            }
            if (typeof confetti === 'function') {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.65 }, zIndex: 10000 });
            }
        } else {
            feedbackTextElement.textContent = `残念！正解は「${correctAnswer}」でした。`;
            feedbackTextElement.classList.add('wrong');
            if (selectedButtonElement) selectedButtonElement.classList.add('wrong');
        }
        nextQuestionBtn.style.display = 'inline-flex';
    }

    function updateProgress() {
        const totalQuestionsInSet = currentQuizSet.length;
        if (totalQuestionsInSet > 0) {
            const progressPercentage = ((currentQuestionIndex) / totalQuestionsInSet) * 100;
            progressBarElement.style.width = `${progressPercentage}%`;
            // 問題番号は1から始まるため currentQuestionIndex + 1
            progressTextElement.textContent = `問題 ${currentQuestionIndex + 1} / ${totalQuestionsInSet}`;
        } else {
            progressBarElement.style.width = `0%`;
            progressTextElement.textContent = `問題 - / -`;
        }
    }

    // --- 結果表示 ---
    function showResults() {
        quizAreaElement.style.display = 'none';
        resultAreaElement.style.display = 'block'; // まず表示してアニメーション開始
        
        // 結果カードのアニメーションを再トリガーするために一旦クラスを削除して再追加することも検討
        // 今回はCSSのanimation-fill-mode: forwards; を利用
        
        const totalAnswered = currentQuizSet.length;
        totalQuestionsOnResultElement.textContent = totalAnswered;

        let rank = '';
        let rankTitle = '';
        let message = '';
        let iconClass = '';
        const percentage = totalAnswered > 0 ? (score / totalAnswered) * 100 : 0;

        if (score === totalAnswered && totalAnswered > 0) { 
            rank = 's'; rankTitle = "トーク神 降臨！";
            message = "中毒お疲れ🤡";
            iconClass = 'fas fa-crown'; // 王冠アイコンに変更
            if (typeof confetti === 'function') { 
                setTimeout(() => { 
                     confetti({ particleCount: 300, spread: 200, origin: { y: 0.2 }, angle: 270, drift: 0.2, gravity: 0.8, zIndex: 10000, scalar: 1.2 });
                     confetti({ particleCount: 200, spread: 160, origin: { y: 0.4 }, zIndex: 10000 });
                }, 700);
            }
        } else if (percentage >= 80) {
            rank = 'a'; rankTitle = "トークマスター";
            message = "お見事！その洞察力、まさに達人の域です！";
            iconClass = 'fas fa-medal';
        } else if (percentage >= 60) {
            rank = 'b'; rankTitle = "トークエキスパート";
            message = "素晴らしい！あと一歩でマスターの称号が…！";
            iconClass = 'fas fa-star';
        } else if (percentage >= 40) {
            rank = 'c'; rankTitle = "トークチャレンジャー";
            message = "なかなかのセンス！継続は力なり、です！";
            iconClass = 'fas fa-face-grin-stars'; // FontAwesome 6
        } else if (percentage >= 20) {
            rank = 'd'; rankTitle = "トーク見習い";
            message = "頑張りました！次はもっと多くの発言を見抜こう！";
            iconClass = 'fas fa-face-smile-beam'; // FontAwesome 6
        } else {
            rank = 'f'; rankTitle = "トークの卵";
            message = "結果はちょっぴり残念…でも、挑戦する心が大切！";
            iconClass = 'fas fa-egg'; // たまごアイコン
        }
        
        resultIconContainer.className = `result-icon-container rank-${rank}`; 
        resultIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
        resultRankTitleElement.textContent = rankTitle;
        resultRankTitleElement.className = `result-rank-title rank-${rank}`;
        resultMessageElement.textContent = message;

        animateValue(finalScoreValueElement, 0, score, 1000 + score * 50); // スコアに応じてアニメーション時間変更

        // 最終的なプログレスバーの状態
        progressBarElement.style.width = '100%';
        progressTextElement.textContent = `全 ${totalAnswered} 問完了！`;
    }
    
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- ユーティリティ ---
    function shuffleArray(array) { 
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // --- イベントリスナー ---
    document.getElementById('current-year').textContent = new Date().getFullYear();

    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuizSet.length) {
            displayQuestion();
            updateProgress(); // ここでプログレスバーとテキストを更新
        } else {
            progressBarElement.style.width = '100%'; // 最後の問題回答後、バーを100%に
            progressTextElement.textContent = `結果を計算中...`; 
            showResults();
        }
    });

    restartBtn.addEventListener('click', () => {
        prepareNewQuizSet(); 
        startGame();
    });
    
    // --- クイズ開始 ---
    initializeQuiz();
});
