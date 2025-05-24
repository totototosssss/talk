document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const messageTextContentElement = document.getElementById('message-text-content'); // Text goes here now
    const messageBubbleElement = document.getElementById('message-text'); // The bubble div itself
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
        if(appContainer) { 
            // App container entrance animation is handled by CSS's `animation-delay`
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
            displayError(`クイズの読み込みに失敗しました: ${error.message}. JSONファイルを確認してください。`);
        }
    }

    function prepareNewQuizSet() {
        let shuffledData = shuffleArray([...allQuizData]); 
        currentQuizSet = shuffledData.slice(0, TARGET_NUM_QUESTIONS); 
        if (currentQuizSet.length === 0 && allQuizData.length > 0) {
             currentQuizSet = shuffledData.slice(0, allQuizData.length); 
        }
    }
    
    function displayError(message) { 
        quizAreaElement.innerHTML = `<p class="error-message">${message}</p>`;
        quizAreaElement.style.display = 'block';
        resultAreaElement.style.display = 'none';
        const header = document.querySelector('.quiz-header');
        if(header) header.style.display = 'none'; // Hide header on error
    }

    // --- クイズ進行 ---
    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        
        resultAreaElement.style.display = 'none';
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { // Reset animation state for result card
            resultCard.style.opacity = '0';
            resultCard.style.transform = 'perspective(1200px) rotateX(-15deg) scale(0.9)';
        }
        
        quizAreaElement.style.display = 'block';
        nextQuestionBtn.style.display = 'none';
        feedbackTextElement.textContent = '';
        feedbackTextElement.className = 'feedback-text'; // Reset visibility and color classes
        
        if (currentQuizSet.length === 0) {
            displayError("出題できるクイズがありません。トーク履歴やPythonスクリプトのフィルター条件を確認してください。");
            return;
        }
        
        updateProgress();
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex < currentQuizSet.length) {
            const currentQuestion = currentQuizSet[currentQuestionIndex];
            messageTextContentElement.innerHTML = currentQuestion.message.replace(/\n/g, '<br>'); // Target new span
            choicesAreaElement.innerHTML = ''; 

            currentQuestion.choices.forEach(choice => {
                const button = document.createElement('button');
                button.textContent = choice;
                button.addEventListener('click', () => handleAnswer(choice, currentQuestion.answer));
                choicesAreaElement.appendChild(button);
            });
            feedbackTextElement.textContent = '';
            feedbackTextElement.className = 'feedback-text';
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
        
        feedbackTextElement.classList.add('visible');

        if (selectedChoice === correctAnswer) {
            score++;
            feedbackTextElement.textContent = "正解！🎉";
            feedbackTextElement.classList.add('correct');
            if (selectedButtonElement) {
                selectedButtonElement.classList.remove('reveal-correct');
                selectedButtonElement.classList.add('correct');
            }
            if (typeof confetti === 'function') {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000, angle: randomRange(60, 120), scalar: randomRange(0.8, 1.2) });
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
            progressTextElement.textContent = `問題 ${currentQuestionIndex + 1} / ${totalQuestionsInSet}`;
        } else {
            progressBarElement.style.width = `0%`;
            progressTextElement.textContent = `問題 - / -`;
        }
    }

    // --- 結果表示 ---
    function showResults() {
        quizAreaElement.style.display = 'none';
        resultAreaElement.style.display = 'block'; 
        
        // Trigger CSS animation for result card (it's set to run on display:block via keyframes)
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { // Ensure animation plays if it was reset
            resultCard.style.animation = 'none'; // Reset animation
            resultCard.offsetHeight; /* trigger reflow */
            resultCard.style.animation = ''; // Re-apply animation from CSS
        }
        
        const totalAnswered = currentQuizSet.length;
        totalQuestionsOnResultElement.textContent = totalAnswered;

        let rank = '';
        let rankTitle = '';
        let message = '';
        let iconClass = '';
        const percentage = totalAnswered > 0 ? (score / totalAnswered) * 100 : 0;

        if (score === totalAnswered && totalAnswered > 0) { 
            rank = 's'; rankTitle = "トーク神 降臨！";
            message = "全問正解！あなたは全てを見通す千里眼の持ち主！";
            iconClass = 'fas fa-crown'; 
            if (typeof confetti === 'function') { 
                setTimeout(() => { 
                     confetti({ particleCount: 250, spread: 180, origin: { y: 0.25 }, angle: 270, drift: 0.1, gravity: 0.7, zIndex: 10000, scalar: 1.3, ticks: 300 });
                     confetti({ particleCount: 200, spread: 160, origin: { y: 0.35 }, zIndex: 10000, ticks: 300 });
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
            iconClass = 'fas fa-face-grin-stars';
        } else if (percentage >= 20) {
            rank = 'd'; rankTitle = "トーク見習い";
            message = "頑張りました！次はもっと多くの発言を見抜こう！";
            iconClass = 'fas fa-face-smile-beam';
        } else {
            rank = 'f'; rankTitle = "トークの卵";
            message = "結果はちょっぴり残念…でも、挑戦する心が大切！";
            iconClass = 'fas fa-egg';
        }
        
        resultIconContainer.className = `result-icon-container rank-${rank}`; 
        resultIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
        resultRankTitleElement.textContent = rankTitle;
        resultRankTitleElement.className = `result-rank-title rank-${rank}`;
        resultMessageElement.textContent = message;

        animateValue(finalScoreValueElement, 0, score, 800 + score * 60);

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
    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // --- イベントリスナー ---
    document.getElementById('current-year').textContent = new Date().getFullYear();

    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuizSet.length) {
            displayQuestion();
            updateProgress(); 
        } else {
            progressBarElement.style.width = '100%'; 
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
