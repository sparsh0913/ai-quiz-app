//const { ErrorEvent } = require("undici-types");

// DOM elements
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-btn");
const topicScreen = document.getElementById("topic-screen"); 
const quizScreen = document.getElementById("quiz-screen");
const questionText = document.getElementById("question-text");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionSpan = document.getElementById("total-question");
const scoreSpan = document.getElementById("score");
const answersContainer = document.getElementById("answers-container");
const progressBar = document.getElementById("progress");
const resultScreen = document.getElementById("screen");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-btn");
const topicButton = document.querySelectorAll(".topic-btn");
const timerSpan = document.getElementById("timer");

const loginScreen = document.getElementById("login-screen");
const usernameInput = document.getElementById("username-input");
const loginButton = document.getElementById("login-btn");
// const container = document.querySelector(".container"); //added

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answersDisabled = false;
let timer;
let timeLeft = 15;

loginButton.addEventListener("click",handleLogin);

function handleLogin(){
const name = usernameInput.value.trim();
if(!name){
  alert("Please enter your name!");
  usernameInput.focus();
  return;
}
localStorage.setItem("username",name);

loginScreen.classList.remove("active");
startScreen.classList.add("active");

const old = document.getElementById("greeting");
if(old) old.remove();

const greeting = document.createElement("h2");
greeting.id = "greeting";
greeting.textContent = `Welcome, ${name}!`;

const startTitle = startScreen.querySelector("h1");
startScreen.insertBefore(greeting,startTitle);
}


async function loadQuiz(topic = "html"){
    try{
         const res = await fetch(`/quiz-data/${topic}`,{cache:"no-store"}); 
        
         if(!res.ok) throw new Error("failed to load quiz data");
         quizQuestions = await res.json();
       //  console.log("Loaded quiz data:",quizQuestions);
 maxScoreSpan.textContent = quizQuestions.length;

         topicScreen.classList.remove("active");
         quizScreen.classList.add("active");
        
        
         currentQuestionIndex = 0;
         score = 0;
         startQuiz();
    } catch(err){
        console.error(err);
        alert("unable to load quiz data.")
    }
}

document.querySelectorAll(".topic-btn").forEach(btn =>{
  btn.addEventListener("click",()=>{
   const topic = btn.dataset.topic;
   loadQuiz(topic);
  })
});

totalQuestionSpan.textContent = quizQuestions.length;
maxScoreSpan.textContent = quizQuestions.length;

//event listeners 

//startButton.addEventListener("click" , ()=>{
    //loadQuiz("html"); */
//});

startButton.addEventListener("click",()=>{
 startScreen.classList.remove("active");
  topicScreen.classList.add("active");
})
restartButton.addEventListener("click" , restartQuiz);

function startQuiz() {
  currentQuestionIndex = 0;
  scoreSpan.textContent = 0;

  //container.classList.remove("active") //added
  topicScreen.classList.remove("active");
  quizScreen.classList.add("active");

  showQuestion()
};

function showQuestion(){
  clearInterval(timer);
    answersDisabled= false;
   const currentQuestion = quizQuestions[currentQuestionIndex];

   currentQuestionSpan.textContent = currentQuestionIndex + 1;
   totalQuestionSpan.textContent = quizQuestions.length;
 const progressPercent = (currentQuestionIndex/quizQuestions.length) * 100;
 progressBar.style.width = progressPercent + "%";

questionText.textContent = currentQuestion.question;

answersContainer.innerHTML = "";

currentQuestion.answers.forEach(answer=> {
    const button = document.createElement("button");
    button.textContent = answer.text
    button.classList.add("answer-btn");
//dataset lets us store custom data 
    button.dataset.correct = answer.correct;

    button.addEventListener("click" , selectAnswer);

    //adding button which we created 
    answersContainer.appendChild(button); 
})
startTimer();
};

function startTimer(){
clearInterval(timer);
timeLeft=15;
timerSpan.textContent = timeLeft;

timer = setInterval(()=> {

timeLeft--;
timerSpan.textContent= timeLeft;
 if(timeLeft <=5){
  timerSpan.style.color = "red";
 } else{
  timerSpan.style.color = "#333";
 }

if(timeLeft <=0){
  clearInterval(timer);
 moveToNextQuestion();
}
},1000);
};

function moveToNextQuestion(){
currentQuestionIndex++;
timerSpan.style.color = "#333";
if(currentQuestionIndex<quizQuestions.length){
  showQuestion();
} else{
  showResults();
}
};

function selectAnswer(event){
 if(answersDisabled) return

 answersDisabled = true
 clearInterval(timer);
 const selectedButton = event.target;
 const isCorrect = selectedButton.dataset.correct === "true";

 //updating the logic behind choosing the answer is correct or not 

 Array.from(answersContainer.children).forEach((button)=>{
  if (button.dataset.correct === "true"){
    button.classList.add("correct")
  } else if(button === selectedButton){
    button.classList.add("incorrect");
  };
});
 
  if(isCorrect){
    score++
    scoreSpan.textContent = score;
  }

  setTimeout(()=>{
   currentQuestionIndex++
    if(currentQuestionIndex < quizQuestions.length){
    showQuestion()
    } else {
           showResults()
    } 
   }
   , 1000)

 ;

 function showResults(){
    quizScreen.classList.remove("active")
    resultScreen.classList.add("active")
   finalScoreSpan.textContent = score;

   const percentage = (score/quizQuestions.length)*100;

   if(percentage == 100){
    resultMessage.textContent = "Perfect You're a genius!"
   } else if(percentage >= 80){
    resultMessage.textContent = "Great job! You know your stuff!"
   } else if(percentage >= 60){
    resultMessage.textContent = "Good effort! Keep learning!"
   } else if(percentage >= 40){
    resultMessage.textContent = "Not bad! Try again to improve"
   } else {
      resultMessage.textContent = "Keep studying! You will get bettter"
   }
 };
}


function restartQuiz() {

 // restartButton.addEventListener("click" , ()=>{
    resultScreen.classList.remove("active")
   startScreen.classList.add("active");
   currentQuestionIndex = 0;
  score = 0;
  scoreSpan.textContent = 0;
 
};

//gemini logic 

// ==================== GEMINI AI QUIZ LOGIC ====================

// Match your HTML IDs exactly:
const generateBtn = document.getElementById("generateBtn");
const aiTopicInput = document.getElementById("topicInput");

generateBtn.addEventListener("click", async () => {
  const topic = aiTopicInput.value.trim();
  if (!topic) {
    alert("Please enter a topic!");
    aiTopicInput.focus();
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";

  try {
    console.log("🧠 Requesting AI quiz for:", topic);

    // Fetch from your backend route
    /* const res = await fetch("http://localhost:3000/generate-quiz" */
    const res = await fetch("https://ai-quiz-app-zwq1.onrender.com/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    if (!res.ok) throw new Error("Failed to generate quiz");

    const aiData = await res.json();
    console.log("✅ AI Quiz Data Received:", aiData);

    // ✅ Validate response
    if (!Array.isArray(aiData) || aiData.length === 0) {
      alert("AI did not return valid quiz data.");
      return;
    }

    // ✅ Inject AI questions into your existing quiz system
    quizQuestions = aiData;
    maxScoreSpan.textContent = quizQuestions.length;
    totalQuestionSpan.textContent = quizQuestions.length;
    currentQuestionIndex = 0;
    score = 0;
    scoreSpan.textContent = score;

    // ✅ Switch screens
    startScreen.classList.remove("active");
    topicScreen.classList.remove("active");
    quizScreen.classList.add("active");

    // ✅ Reset timer and start first question
    clearInterval(timer);
    timeLeft = 15;
    timerSpan.textContent = timeLeft;
    startTimer();
    showQuestion();

    console.log("🎯 AI quiz started successfully!");

  } catch (error) {
    console.error("❌ Error generating AI quiz:", error);
    alert("Something went wrong while generating the AI quiz. Please try again.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate AI Quiz";
  }
});
