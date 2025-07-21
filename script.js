document.addEventListener("DOMContentLoaded", () => {
    // All code now runs after the document is fully loaded.

    let quizData = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let answeredQuestions;
    let explanationsShown;
    let selectedAnswers;

    // DOM Elements
    const questionText = document.getElementById("question-text");
    const choicesContainer = document.getElementById("choices-container");
    const explanationBox = document.getElementById("explanation");
    const progressText = document.getElementById("progress");
    const progressBar = document.getElementById("progress-bar"); // New progress bar element
    const correctText = document.getElementById("correct");
    const incorrectText = document.getElementById("incorrect");
    const questionList = document.getElementById("question-list");
    const quizContent = document.querySelector(".quiz-content");
    const resultsContainer = document.getElementById("results-container");
    const questionNav = document.querySelector(".question-nav");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const restartBtn = document.getElementById("restart-btn");
    const reviewBtn = document.getElementById("review-btn");

    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            initializeQuizState();
            renderSidebar();
            loadQuestion(0);
        })
        .catch(error => console.error('Error loading quiz data:', error));

    function initializeQuizState() {
        answeredQuestions = JSON.parse(sessionStorage.getItem("answeredQuestions")) || new Array(quizData.length).fill(false);
        explanationsShown = JSON.parse(sessionStorage.getItem("explanationsShown")) || new Array(quizData.length).fill(false);
        selectedAnswers = JSON.parse(sessionStorage.getItem("selectedAnswers")) || new Array(quizData.length).fill(null);
        
        recalculateScore();
    }
    
    function recalculateScore() {
        correctAnswers = 0;
        incorrectAnswers = 0;
        answeredQuestions.forEach((answered, index) => {
            if (answered && selectedAnswers[index] !== null) {
                if (selectedAnswers[index] === quizData[index].correctAnswer) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            }
        });
    }

    function renderSidebar() {
        questionList.innerHTML = "";
        quizData.forEach((_, index) => {
            const listItem = document.createElement("li");
            listItem.textContent = index + 1;
            listItem.classList.add("question-bubble");
            if (answeredQuestions[index]) {
                listItem.style.backgroundColor = selectedAnswers[index] === quizData[index].correctAnswer ? "green" : "red";
            }
            listItem.onclick = () => loadQuestion(index);
            questionList.appendChild(listItem);
        });
    }

    window.onload = function() {
        alert("Welcome to the quiz!\n\nHotkeys Available:\n- Space: Next Question\n- B: Previous Question\n- 1-5: Select Answer Choices\nAnki remotes should be compatible!\n\nGood luck!");
    };

    function loadQuestion(index) {
        if (index >= quizData.length) {
            showResultsPopup();
            return;
        }

        currentQuestionIndex = index;
        const q = quizData[index];
        
        questionText.textContent = q.question;
        choicesContainer.innerHTML = "";
        choicesContainer.className = ""; // Reset classes
        
        q.choices.forEach((choice, i) => {
            const button = document.createElement("button");
            button.textContent = choice;
            button.onclick = () => checkAnswer(i);
            choicesContainer.appendChild(button);
        });

        if (answeredQuestions[index]) {
            choicesContainer.classList.add("answered");
            const correctChoiceIndex = q.correctAnswer;
            const selectedChoiceIndex = selectedAnswers[index];
            
            choicesContainer.children[correctChoiceIndex].classList.add("correct");
            if (selectedChoiceIndex !== correctChoiceIndex) {
                choicesContainer.children[selectedChoiceIndex].classList.add("incorrect");
            }
        }

        if (explanationsShown[index]) {
            explanationBox.textContent = q.explanation;
            explanationBox.classList.remove("hidden");
        } else {
            explanationBox.textContent = "";
            explanationBox.classList.add("hidden");
        }

        updateProgress();
    }

    function checkAnswer(selectedIndex) {
        if (answeredQuestions[currentQuestionIndex]) return;

        const q = quizData[currentQuestionIndex];
        const questionBubble = document.querySelector(`.question-nav li:nth-child(${currentQuestionIndex + 1})`);

        answeredQuestions[currentQuestionIndex] = true;
        explanationsShown[currentQuestionIndex] = true;
        selectedAnswers[currentQuestionIndex] = selectedIndex;
        
        if (selectedIndex === q.correctAnswer) {
            correctAnswers++;
            questionBubble.style.backgroundColor = "green";
        } else {
            incorrectAnswers++;
            questionBubble.style.backgroundColor = "red";
        }
        
        sessionStorage.setItem("answeredQuestions", JSON.stringify(answeredQuestions));
        sessionStorage.setItem("explanationsShown", JSON.stringify(explanationsShown));
        sessionStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers));
        
        updateProgress(); // Update progress right after answering
        loadQuestion(currentQuestionIndex); // Reload to show correct/incorrect styles
    }

    function updateProgress() {
        const totalAnswered = answeredQuestions.filter(Boolean).length;
        progressText.textContent = `${totalAnswered}/${quizData.length}`;
        correctText.textContent = correctAnswers;
        incorrectText.textContent = incorrectAnswers;

        // Update the visual progress bar
        const progressPercentage = quizData.length > 0 ? (totalAnswered / quizData.length) * 100 : 0;
        progressBar.style.width = `${progressPercentage}%`;
    }

    function showResultsPopup() {
        quizContent.classList.add("hidden");
        questionNav.classList.add("hidden");
        recalculateScore();
        updateProgress();

        const scorePercentage = quizData.length > 0 ? ((correctAnswers / quizData.length) * 100).toFixed(2) : 0;
        document.getElementById("final-score").textContent = `You scored ${correctAnswers} out of ${quizData.length} (${scorePercentage}%)!`;
        resultsContainer.classList.remove("hidden");

        // Trigger confetti for scores 80% or higher
        if (scorePercentage >= 80) {
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            });
        }
    }

    function restartQuiz() {
        sessionStorage.clear();
        window.location.reload();
    }

    function reviewQuiz() {
        resultsContainer.classList.add("hidden");
        quizContent.classList.remove("hidden");
        questionNav.classList.remove("hidden");
        loadQuestion(0);
    }
    
    // --- EVENT LISTENERS ---
    nextBtn.onclick = () => {
        if (currentQuestionIndex < quizData.length - 1) {
            loadQuestion(currentQuestionIndex + 1);
        } else {
            showResultsPopup();
        }
    };
    
    prevBtn.onclick = () => {
        if (currentQuestionIndex > 0) {
            loadQuestion(currentQuestionIndex - 1);
        }
    };

    restartBtn.onclick = restartQuiz;
    reviewBtn.onclick = reviewQuiz;
    
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") nextBtn.click();
        if (event.code === "KeyB") prevBtn.click();
        if (event.key >= "1" && event.key <= "5") {
            const answerIndex = parseInt(event.key) - 1;
            if (choicesContainer.children[answerIndex]) {
                choicesContainer.children[answerIndex].click();
            }
        }
    });
});
