
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ALL_QUESTIONS } from './constants';
import { GameStatus, Question, QuizResult } from './types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TOTAL_TIME = 30;
const QUESTIONS_PER_SESSION = 10;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<{question: string, user: string, correct: string, isCorrect: boolean}[]>([]);
  
  // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> to avoid 'NodeJS' namespace error in browser-only environments
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus(GameStatus.FINISHED);
  }, []);

  const startGame = () => {
    // Shuffle and pick 10 questions
    const shuffled = [...ALL_QUESTIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, QUESTIONS_PER_SESSION);
    
    setCurrentQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setUserAnswers([]);
    setResults(null);
    setStatus(GameStatus.PLAYING);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (optionIdx: number) => {
    const letters = ['A', 'B', 'C', 'D'];
    const chosen = letters[optionIdx];
    const currentQ = currentQuestions[currentIndex];
    const isCorrect = chosen === currentQ.answer;

    setUserAnswers(prev => [...prev, {
      question: currentQ.text,
      user: chosen,
      correct: currentQ.answer,
      isCorrect
    }]);

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setScore(prev => prev - 1);
    }

    if (currentIndex + 1 < QUESTIONS_PER_SESSION) {
      setCurrentIndex(prev => prev + 1);
    } else {
      endGame();
    }
  };

  useEffect(() => {
    if (status === GameStatus.FINISHED) {
      const correct = userAnswers.filter(a => a.isCorrect).length;
      const incorrect = userAnswers.length - correct;
      setResults({
        score,
        correctCount: correct,
        incorrectCount: incorrect,
        totalAnswered: userAnswers.length
      });
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, userAnswers, score]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-2">
          🐘 大象專題研習測驗
        </h1>
        <p className="text-slate-600 italic">《動物園雜誌》專題內容</p>
      </header>

      {status === GameStatus.START && (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-indigo-50">
          <div className="mb-6 text-indigo-600 text-6xl">📝</div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">準備好接受挑戰了嗎？</h2>
          <ul className="text-left text-slate-600 mb-8 max-w-sm mx-auto space-y-2">
            <li>🕒 限時：<span className="font-bold text-indigo-600">30 秒</span></li>
            <li>❓ 題數：隨機抽選 <span className="font-bold text-indigo-600">10 題</span></li>
            <li>💯 計分：答對 <span className="text-green-600">+1</span>，答錯 <span className="text-red-600">-1</span></li>
          </ul>
          <button 
            onClick={startGame}
            className="w-full md:w-64 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            開始測驗
          </button>
        </div>
      )}

      {status === GameStatus.PLAYING && currentQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">進度</span>
              <span className="text-xl font-bold text-indigo-600">{currentIndex + 1} / {QUESTIONS_PER_SESSION}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">剩餘時間</span>
              <span className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">當前分數</span>
              <span className="text-xl font-bold text-emerald-600">{score}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-slate-100 animate-fadeIn">
            <h3 className="text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">
              {currentQuestions[currentIndex].text}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestions[currentIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="group flex items-center p-4 border-2 border-slate-100 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50 transition-all active:bg-indigo-100"
                >
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 font-bold mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="text-slate-700 group-hover:text-indigo-900 font-medium">{opt}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-500 transition-all duration-300"
               style={{ width: `${((currentIndex + 1) / QUESTIONS_PER_SESSION) * 100}%` }}
             ></div>
          </div>
        </div>
      )}

      {status === GameStatus.FINISHED && results && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-indigo-50">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">測驗結束！</h2>
            <div className="inline-block py-2 px-6 bg-indigo-100 text-indigo-700 rounded-full font-bold text-lg mb-6">
              總得分：{results.score}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-2xl mx-auto">
              <div className="h-64 flex justify-center">
                <Pie 
                  data={{
                    labels: ['正確', '錯誤', '未答'],
                    datasets: [{
                      data: [results.correctCount, results.incorrectCount, QUESTIONS_PER_SESSION - results.totalAnswered],
                      backgroundColor: ['#10b981', '#ef4444', '#cbd5e1'],
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="font-semibold text-emerald-700">正確回答</span>
                  <span className="text-emerald-800 font-bold">{results.correctCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-semibold text-red-700">錯誤回答</span>
                  <span className="text-red-800 font-bold">{results.incorrectCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-semibold text-slate-700">總挑戰數</span>
                  <span className="text-slate-800 font-bold">{QUESTIONS_PER_SESSION}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-lg font-bold text-slate-800 mb-4">答題詳情</h4>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {userAnswers.map((ua, i) => (
                <div key={i} className={`p-4 rounded-xl border ${ua.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <p className="font-medium text-slate-800 mb-1">{i+1}. {ua.question}</p>
                  <p className="text-sm">
                    您的答案: <span className="font-bold">{ua.user}</span> | 
                    正確答案: <span className="font-bold text-emerald-600">{ua.correct}</span>
                  </p>
                </div>
              ))}
              {userAnswers.length < QUESTIONS_PER_SESSION && (
                <div className="p-4 rounded-xl border bg-slate-100 border-slate-200 text-slate-500 italic">
                  其餘題項因時間到未作答
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
            >
              再試一次
            </button>
            <button 
              onClick={() => setStatus(GameStatus.START)}
              className="px-10 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full shadow transition-all"
            >
              回首頁
            </button>
          </div>
        </div>
      )}
      
      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>© 2024 動物園雜誌大象專題研習系統</p>
        <p>基於 React + Chart.js + Tailwind CSS 構建</p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
