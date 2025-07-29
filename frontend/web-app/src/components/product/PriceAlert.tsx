import React, { useState } from 'react';
import { toast } from 'sonner';

interface PriceAlertProps {
  productId: string;
  productName: string;
  currentPrice: number;
}

const PriceAlert: React.FC<PriceAlertProps> = ({ productId, productName, currentPrice }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString());
  const [email, setEmail] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      toast.error('Iltimos, email manzilingizni kiriting');
      return;
    }

    // Validate target price
    const parsedTargetPrice = parseFloat(targetPrice);
    if (isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
      toast.error("Iltimos, to'g'ri narx kiriting");
      return;
    }

    // In a real application, this would make an API call to save the price alert
    // For now, we'll just show a success toast
    toast.success(
      `Narx xabarnomasi sozlandi! Mahsulot narxi ${parsedTargetPrice} so'mga yetganda sizga xabar yuboriladi.`
    );

    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition duration-200"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Narx xabarnomasi
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Narx xabarnomasi o'rnatish</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <strong>{productName}</strong> uchun narx xabarnomasi o'rnatmoqchimisiz? Siz
              ko'rsatgan narxga yetganda sizga email orqali xabar yuboriladi.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Joriy narx</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={currentPrice.toFixed(2)}
                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="target-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Maqsadli narx
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="target-price"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    aria-describedby="price-currency"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Mahsulot narxi siz ko'rsatgan narxga yetganda, sizga xabar yuboriladi
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email manzil
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@mail.com"
                />
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mr-3 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Xabarni o'rnatish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceAlert;
