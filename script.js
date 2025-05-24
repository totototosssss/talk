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
// --- 結果表示 (ここを書き換えます) ---
    function showResults() {
        quizAreaElement.style.display = 'none';
        resultAreaElement.style.display = 'block'; 
        
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { 
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; /* trigger reflow */
            resultCard.style.animation = ''; 
        }
        
        const totalAnswered = currentQuizSet.length;
        totalQuestionsOnResultElement.textContent = totalAnswered;

        let rank = ''; // CSSクラス制御用 (splus, s, aplus, a, bplus, b, c, d)
        let rankTitle = ''; // 画面に表示される称号
        let message = '';   // 画面に表示されるメッセージ
        let iconClass = ''; // Font Awesome アイコンクラス
        const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

        if (score === totalAnswered && totalAnswered > 0) { 
            rank = 'splus'; // Perfect Score
            rankTitle = "中毒お疲れ🤡"; // ご要望の煽りタイトル
            message = "全問正解…さては、このトーク履歴と共に生きてます？その情熱、別の方向にも活かせるかも…しれませんねぇ？";
            iconClass = 'fas fa-ghost'; // 煽り感を増すためにゴーストアイコンなど（お好みで fas fa-crown も可）
            if (typeof confetti === 'function') { 
                setTimeout(() => { 
                     // 控えめだけど皮肉っぽい紙吹雪？あるいは派手なままか。
                     confetti({ particleCount: 150, spread: 120, origin: { y: 0.4 }, angle: randomRange(45, 135), drift: randomRange(-0.1, 0.1), scalar: randomRange(0.7, 1.1), zIndex: 10000, ticks: 250, colors: ['#FFD700', '#FF69B4', '#8A2BE2'] }); // 金、ピンク、紫など派手目
                     confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 }, angle: randomRange(225, 315), drift: randomRange(-0.1, 0.1), scalar: randomRange(0.6, 1.0), zIndex: 10000, ticks: 200, colors: ['#000000', '#4B0082', '#FF0000'] }); // 黒、濃紫、赤などダークな煽り
                }, 700);
            }
        } else if (percentage >= 90) { // 90-99%
            rank = 's'; 
            rankTitle = "トーク界の覇者";
            message = "ほぼ完璧！あなたの前では、どんな些細な発言も見逃されませんね。まさに神業！";
            iconClass = 'fas fa-dragon'; // 龍や神話生物など
        } else if (percentage >= 80) { // 80-89%
            rank = 'aplus'; 
            rankTitle = "超絶技巧リスナー";
            message = "素晴らしい！発言のニュアンスまで読み解くとは…！あなたは選ばれし者。";
            iconClass = 'fas fa-gem'; // ダイヤモンド
        } else if (percentage >= 70) { // 70-79%
            rank = 'a';
            rankTitle = "発言ソムリエ";
            message = "お見事！的確な分析力、流石です。トークの機微を心得ていますね！";
            iconClass = 'fas fa-award';
        } else if (percentage >= 60) { // 60-69%
            rank = 'bplus';
            rankTitle = "事情通エージェント";
            message = "かなり詳しいですね！重要情報を見抜くスパイの素質アリ…かも？";
            iconClass = 'fas fa-user-secret'; // 秘密諜報員
        } else if (percentage >= 40) { // 40-59%
            rank = 'b';
            rankTitle = "うわさ好きの隣人";
            message = "おっと、聞き耳を立ててました？ゴシップの香りがしますよ…もう少しで核心に迫れたのに！";
            iconClass = 'fas fa-耳'; // 耳アイコン (fa-ear-listen だとより良い) fas fa-solid fa-ear-listen
        } else if (percentage >= 20) { // 20-39%
            rank = 'c';
            rankTitle = "迷宮のコメンテーター";
            message = "あれれ…？そのコメント、どの次元から…？大丈夫、きっと明日は違う電波を受信できますよ。たぶん。";
            iconClass = 'fas fa-satellite-dish'; // 衛星アンテナ
        } else { // 0-19%
            rank = 'd';
            rankTitle = "異世界チャッター";
            message = "…もしかして、まだチュートリアルでした？心配ご無用！誰だって最初はそんなものです（と、思いたい）。さぁ、深呼吸してもう一度！";
            iconClass = 'fas fa-question-circle'; // はてなマーク
        }
        
        resultIconContainer.className = `result-icon-container rank-${rank}`; 
        resultIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
        resultRankTitleElement.textContent = rankTitle;
        resultRankTitleElement.className = `result-rank-title rank-${rank}`; // CSSでランクごとのスタイルを当てるため
        resultMessageElement.textContent = message;

        animateValue(finalScoreValueElement, 0, score, 800 + score * 60);

        progressBarElement.style.width = '100%';
        progressTextElement.textContent = `全 ${totalAnswered} 問完了！`;
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
