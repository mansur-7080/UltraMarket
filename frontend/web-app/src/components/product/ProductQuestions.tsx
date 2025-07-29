import React, { useState } from 'react';

interface Question {
  id: string;
  userId: string;
  userName: string;
  question: string;
  date: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
  isFromSeller: boolean;
  helpful: number;
  notHelpful: number;
}

interface ProductQuestionsProps {
  productId: string;
}

const ProductQuestions: React.FC<ProductQuestionsProps> = ({ productId }) => {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q1',
      userId: 'u1',
      userName: 'Aziz S.',
      question: "Bu telefon suv o'tkazmaydimi?",
      date: '2025-06-12T09:15:00Z',
      answers: [
        {
          id: 'a1',
          userId: 'seller',
          userName: 'Samsung Rasmiy',
          text: "Ha, Galaxy S21 Ultra IP68 reyting bilan suv o'tkazmaydigan qilib ishlab chiqarilgan. 1.5 metr chuqurlikda 30 daqiqagacha suv ostida qolishga chidaydi.",
          date: '2025-06-13T14:30:00Z',
          isFromSeller: true,
          helpful: 15,
          notHelpful: 1,
        },
        {
          id: 'a2',
          userId: 'u2',
          userName: 'Jamshid K.',
          text: "Men o'zimnikini bir marta basseynda ishlatdim, muammo bo'lmadi. Lekin dengiz suvida sinab ko'rmaganman.",
          date: '2025-06-14T08:45:00Z',
          isFromSeller: false,
          helpful: 8,
          notHelpful: 0,
        },
      ],
    },
    {
      id: 'q2',
      userId: 'u3',
      userName: 'Gulnora M.',
      question: 'Qora rangda bormi?',
      date: '2025-06-10T16:20:00Z',
      answers: [
        {
          id: 'a3',
          userId: 'seller',
          userName: 'Samsung Rasmiy',
          text: "Ha, Galaxy S21 Ultra qora, kumush, to'q ko'k va jigarrang ranglarida mavjud.",
          date: '2025-06-10T17:15:00Z',
          isFromSeller: true,
          helpful: 6,
          notHelpful: 0,
        },
      ],
    },
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [replyToQuestionId, setReplyToQuestionId] = useState<string | null>(null);

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be sent to an API
    const newQuestionObj: Question = {
      id: `q${questions.length + 1}`,
      userId: 'current-user',
      userName: 'Siz',
      question: newQuestion,
      date: new Date().toISOString(),
      answers: [],
    };

    setQuestions([newQuestionObj, ...questions]);
    setNewQuestion('');
    setShowQuestionForm(false);
  };

  const handleAnswerSubmit = (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    // In a real app, this would be sent to an API
    const newAnswerObj: Answer = {
      id: `a${new Date().getTime()}`,
      userId: 'current-user',
      userName: 'Siz',
      text: newAnswer,
      date: new Date().toISOString(),
      isFromSeller: false,
      helpful: 0,
      notHelpful: 0,
    };

    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: [...q.answers, newAnswerObj],
          };
        }
        return q;
      })
    );
    setNewAnswer('');
    setReplyToQuestionId(null);
  };

  const handleHelpfulClick = (questionId: string, answerId: string, isHelpful: boolean) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.map((a) => {
              if (a.id === answerId) {
                return {
                  ...a,
                  helpful: isHelpful ? a.helpful + 1 : a.helpful,
                  notHelpful: !isHelpful ? a.notHelpful + 1 : a.notHelpful,
                };
              }
              return a;
            }),
          };
        }
        return q;
      })
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${date.getFullYear()}`;
  };

  return (
    <div className="mt-12 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Savollar va javoblar</h2>

      <div className="mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300"
          onClick={() => setShowQuestionForm(true)}
        >
          Savol berish
        </button>
      </div>

      {showQuestionForm && (
        <div className="mb-8 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Yangi savol berish</h3>
          <form onSubmit={handleQuestionSubmit}>
            <div className="mb-4">
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                Savolingiz
              </label>
              <textarea
                id="question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition duration-300"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300"
              >
                Yuborish
              </button>
            </div>
          </form>
        </div>
      )}

      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-lg font-medium">{question.question}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{question.userName}</span>
                        <span className="mx-2">&middot;</span>
                        <span>{formatDate(question.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    expandedQuestionId === question.id
                      ? setExpandedQuestionId(null)
                      : setExpandedQuestionId(question.id)
                  }
                  className="text-blue-600 hover:text-blue-800"
                >
                  {expandedQuestionId === question.id
                    ? 'Javoblarni yopish'
                    : `${question.answers.length} ta javobni ko'rish`}
                </button>
              </div>

              {expandedQuestionId === question.id && (
                <div className="mt-4 pl-10">
                  {question.answers.length > 0 ? (
                    <div className="space-y-4">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {answer.isFromSeller && (
                                <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                                  Rasmiy
                                </span>
                              )}
                              <span className="font-medium">{answer.userName}</span>
                              <span className="mx-2 text-gray-500">&middot;</span>
                              <span className="text-sm text-gray-500">
                                {formatDate(answer.date)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2">{answer.text}</p>
                          <div className="flex items-center mt-3 text-sm">
                            <span className="text-gray-600 mr-4">Bu javob foydali bo'ldimi?</span>
                            <button
                              onClick={() => handleHelpfulClick(question.id, answer.id, true)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-md text-xs mr-2"
                            >
                              Ha ({answer.helpful})
                            </button>
                            <button
                              onClick={() => handleHelpfulClick(question.id, answer.id, false)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-md text-xs"
                            >
                              Yo'q ({answer.notHelpful})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Bu savolga hali javob berilmagan.</p>
                  )}

                  <div className="mt-4">
                    {replyToQuestionId === question.id ? (
                      <form onSubmit={(e) => handleAnswerSubmit(e, question.id)}>
                        <div className="mb-3">
                          <label
                            htmlFor={`answer-${question.id}`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Sizning javobingiz
                          </label>
                          <textarea
                            id={`answer-${question.id}`}
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          ></textarea>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setReplyToQuestionId(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded-md text-sm"
                          >
                            Bekor qilish
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                          >
                            Javob berish
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setReplyToQuestionId(question.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Javob berish
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">Bu mahsulot haqida hali savollar yo'q.</p>
        </div>
      )}
    </div>
  );
};

export default ProductQuestions;
