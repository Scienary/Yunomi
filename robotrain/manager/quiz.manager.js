var QuizManager = function() {

    this.start = function(chatbot) {

    }

    this.nextQuestion = function() {

    }
}

var quizManager;

module.exports = () => {
    if (!quizManager) quizManager = new QuizManager();
    return quizManager;
};