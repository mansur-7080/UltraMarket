import React, { useState } from 'react';
import { format } from 'date-fns';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
}

interface ReviewsProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

const ProductReviews: React.FC<ReviewsProps> = ({ productId, averageRating, reviewCount }) => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      userId: 'u1',
      userName: 'Komiljon A.',
      rating: 5,
      title: 'Ajoyib mahsulot',
      comment:
        "Bu telefon mening kutganimdan ham yaxshi chiqdi. Kamera sifati juda zo'r, batareya bir kun davomida yetadi va ishlash tezligi juda yuqori.",
      date: '2025-05-15T08:00:00Z',
      helpful: 12,
      notHelpful: 2,
      verified: true,
    },
    {
      id: '2',
      userId: 'u2',
      userName: 'Diyora M.',
      rating: 4,
      title: 'Yaxshi telefon, lekin...',
      comment:
        "Umumiy jihatdan yaxshi telefon, lekin batareyasi uncha ko'p chidamaydi. Kamida har kuni quvvatlab turishga to'g'ri keladi.",
      date: '2025-05-10T10:30:00Z',
      helpful: 5,
      notHelpful: 1,
      verified: true,
    },
    {
      id: '3',
      userId: 'u3',
      userName: 'Bobur R.',
      rating: 3,
      title: "O'rtacha",
      comment:
        'Kamerasi yaxshi, lekin narxiga nisbatan uncha chidamli emas ekan. Samsung S20 dan farqi kam.',
      date: '2025-05-08T14:15:00Z',
      helpful: 8,
      notHelpful: 3,
      verified: false,
    },
  ]);

  const [filter, setFilter] = useState('all');
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be sent to an API
    const newReviewObj: Review = {
      id: `r${reviews.length + 1}`,
      userId: 'current-user',
      userName: 'Siz',
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      date: new Date().toISOString(),
      helpful: 0,
      notHelpful: 0,
      verified: true,
    };

    setReviews([newReviewObj, ...reviews]);
    setNewReview({
      rating: 5,
      title: '',
      comment: '',
    });
    setShowReviewForm(false);
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'all') return true;
    return review.rating === Number(filter);
  });

  const handleHelpfulClick = (reviewId: string, isHelpful: boolean) => {
    setReviews(
      reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            helpful: isHelpful ? review.helpful + 1 : review.helpful,
            notHelpful: !isHelpful ? review.notHelpful + 1 : review.notHelpful,
          };
        }
        return review;
      })
    );
  };

  return (
    <div className="mt-12 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mijozlar sharhlari</h2>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="mb-6">
            <div className="flex items-center">
              <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
              <div className="ml-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-sm text-gray-500">{reviewCount} ta sharh</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300"
              onClick={() => setShowReviewForm(true)}
            >
              Sharh qoldirish
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sharh filtri</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barcha sharxlar</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 yulduz)</option>
              <option value="4">⭐⭐⭐⭐ (4 yulduz)</option>
              <option value="3">⭐⭐⭐ (3 yulduz)</option>
              <option value="2">⭐⭐ (2 yulduz)</option>
              <option value="1">⭐ (1 yulduz)</option>
            </select>
          </div>
        </div>

        <div className="md:w-2/3">
          {showReviewForm && (
            <div className="mb-8 bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Yangi sharh qo'shish</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reyting</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 ${
                            star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="reviewTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sarlavha
                  </label>
                  <input
                    type="text"
                    id="reviewTitle"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="reviewComment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sharh
                  </label>
                  <textarea
                    id="reviewComment"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
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

          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <h3 className="text-lg font-semibold mt-2">{review.title}</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(review.date), 'dd.MM.yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 mb-2">
                    <span className="text-sm font-medium">{review.userName}</span>
                    {review.verified && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        Tasdiqlangan xarid
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                  <div className="flex items-center mt-4">
                    <span className="text-sm text-gray-600 mr-4">Bu sharh foydali bo'ldimi?</span>
                    <button
                      onClick={() => handleHelpfulClick(review.id, true)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded-md text-sm mr-2"
                    >
                      Ha ({review.helpful})
                    </button>
                    <button
                      onClick={() => handleHelpfulClick(review.id, false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded-md text-sm"
                    >
                      Yo'q ({review.notHelpful})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Sharxlar mavjud emas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
