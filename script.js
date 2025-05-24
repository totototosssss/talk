document.addEventListener('DOMContentLoaded', () => {
    const messageTextElement = document.getElementById('message-text');
    const choicesAreaElement = document.getElementById('choices-area');
    const feedbackTextElement = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizAreaElement = document.getElementById('quiz-area');
    const resultAreaElement = document.getElementById('result-area');
    const scoreElement = document.getElementById('score');
    const totalQuestionsElement = document.getElementById('total-questions');
    const restartBtn = document.getElementById('restart-btn');
    const progressBarElement = document.getElementById('progress-bar');
    const progressTextElement = document.getElementById('progress-text');
    const scorePercentageElement = document.getElementById('score-percentage');


    let quizData = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let questionsToAsk = 0; // 表示する問題数（quizData.lengthとは限らない）
    const MAX_QUESTIONS = 50; // 最大表示問題数（お好みで調整）


    async function loadQuizData() {
        try {
            const response = await fetch('quiz_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let rawData = await response.json();
            if (rawData.length === 0) {
                displayError("クイズデータが空です。txtファイルからデータが生成されませんでした。");
                return;
            }
            quizData = shuffleArray(rawData); // 問題をシャッフル
            questionsToAsk = Math.min(quizData.length, MAX_QUESTIONS); //実際に表示する問題数を設定
            if (questionsToAsk === 0) {
                 displayError("表示できるクイズがありません。");
                 return;
            }
            startGame();
        } catch (error) {
            console.error("クイズデータの読み込みに失敗しました:", error);
            displayError("クイズデータの読み込みに失敗しました。ファイルを確認してください。");
        }
    }
    
    function displayError(message) {
        quizAreaElement.innerHTML = `<p class="error-message">${message}</p>`;
        quizAreaElement.style.display = 'block';
        resultAreaElement.style.display = 'none';
        document.querySelector('.quiz-header').style.display = 'none'; // ヘッダーも非表示に
    }


    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        quizAreaElement.style.display = 'block'; // mainタグをquiz-contentクラスに変更したので、こちらを参照
        resultAreaElement.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        feedbackTextElement.textContent = '';
        feedbackTextElement.className = ''; // クラスをリセット
        updateProgress();
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex < questionsToAsk) {
            const currentQuestion = quizData[currentQuestionIndex];
            messageTextElement.textContent = currentQuestion.message;
            // messageTextElement.innerHTML = currentQuestion.message.replace(/\n/g, '<br>'); // メッセージ内の改行を<br>に
            choicesAreaElement.innerHTML = ''; 

            currentQuestion.choices.forEach(choice => {
                const button = document.createElement('button');
                button.textContent = choice;
                button.addEventListener('click', () => handleAnswer(choice, currentQuestion.answer, currentQuestion.choices));
                choicesAreaElement.appendChild(button);
            });
            feedbackTextElement.textContent = '';
            feedbackTextElement.className = '';
            nextQuestionBtn.style.display = 'none';
        } else {
            showResults();
        }
    }

    function handleAnswer(selectedChoice, correctAnswer, allChoices) {
        const buttons = choicesAreaElement.getElementsByTagName('button');
        let selectedButtonElement = null;

        for (let btn of buttons) {
            btn.disabled = true;
            if (btn.textContent === selectedChoice) {
                selectedButtonElement = btn;
            }
            if (btn.textContent === correctAnswer) { // 正解の選択肢に印をつける
                btn.classList.add('reveal-correct'); 
            }
        }

        if (selectedChoice === correctAnswer) {
            score++;
            feedbackTextElement.textContent = "正解！🎉";
            feedbackTextElement.className = 'correct';
            if (selectedButtonElement) selectedButtonElement.classList.add('correct');
        } else {
            feedbackTextElement.textContent = `残念！正解は「${correctAnswer}」でした。`;
            feedbackTextElement.className = 'wrong';
            if (selectedButtonElement) selectedButtonElement.classList.add('wrong');
        }
        
        // reveal-correctがついた正解ボタンから、選択された場合のクラス(correct/wrong)を優先
        // もし正解のボタンが選択されていれば、.correctが優先される
        const correctButtonElement = Array.from(buttons).find(btn => btn.textContent === correctAnswer);
        if (correctButtonElement && selectedChoice === correctAnswer) {
            correctButtonElement.classList.remove('reveal-correct'); // 選択して正解した場合、revealは不要
            correctButtonElement.classList.add('correct');
        } else if (correctButtonElement) {
             correctButtonElement.classList.add('reveal-correct'); // 強調
        }


        nextQuestionBtn.style.display = 'inline-block';
    }

    function updateProgress() {
        if (questionsToAsk > 0) {
            const progressPercentage = (currentQuestionIndex / questionsToAsk) * 100;
            progressBarElement.style.width = `${progressPercentage}%`;
            progressTextElement.textContent = `問題 ${currentQuestionIndex + 1} / ${questionsToAsk}`;
        } else {
            progressBarElement.style.width = `0%`;
            progressTextElement.textContent = `問題 - / -`;
        }
    }


    function showResults() {
        quizAreaElement.style.display = 'none';
        resultAreaElement.style.display = 'block';
        scoreElement.textContent = score;
        totalQuestionsElement.textContent = questionsToAsk;
        const percentage = questionsToAsk > 0 ? Math.round((score / questionsToAsk) * 100) : 0;
        scorePercentageElement.textContent = `正解率: ${percentage}%`;

        // Final progress update
        progressBarElement.style.width = '100%';
        progressTextElement.textContent = `全 ${questionsToAsk} 問完了`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questionsToAsk) {
            updateProgress();
            displayQuestion();
        } else { // currentQuestionIndex === questionsToAsk
             updateProgress(); // 最後の問題の表示のためにバーを100%にする
            showResults();
        }
    });

    restartBtn.addEventListener('click', () => {
        // データを再シャッフルして新しい問題セットで開始も可能
        // quizData = shuffleArray(quizData); 
        // questionsToAsk = Math.min(quizData.length, MAX_QUESTIONS);
        // loadQuizData(); // or just startGame if data is already loaded and shuffled
        startGame();
    });

    loadQuizData();
});
