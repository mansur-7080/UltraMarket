import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearCart } from '../store/slices/cartSlice';
// Temporary type definitions
enum UzbekPaymentMethod {
  CLICK = 'click',
  PAYME = 'payme',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

interface UzbekAddressType {
  region: string;
  district: string;
  mahalla: string;
  street: string;
  house: string;
  apartment: string;
  landmark: string;
  deliveryInstructions: string;
}

interface OrderData {
  id: string;
  items: any[];
  total: number;
  paymentMethod: UzbekPaymentMethod;
  deliveryAddress: UzbekAddressType;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
}

const CheckoutPage: React.FC = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<UzbekPaymentMethod>(UzbekPaymentMethod.CLICK);

  const [deliveryAddress, setDeliveryAddress] = useState<UzbekAddressType>({
    type: 'HOME' as const,
    region: '',
    district: '',
    mahalla: '',
    street: '',
    house: '',
    apartment: '',
    postalCode: '',
    landmark: '',
    deliveryInstructions: '',
  });

  const formatUZSPrice = (price: number): string => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 25000; // 25,000 so'm
  const total = subtotal + deliveryFee;

  const uzbekRegions = [
    'Toshkent shahri',
    'Toshkent viloyati',
    'Samarqand',
    'Buxoro',
    'Andijon',
    "Farg'ona",
    'Namangan',
    'Qashqadaryo',
    'Surxondaryo',
    'Jizzax',
    'Sirdaryo',
    'Navoiy',
    'Xorazm',
    "Qoraqalpog'iston",
  ];

  const paymentMethodLabels = {
    [UzbekPaymentMethod.CLICK]: "Click to'lov tizimi",
    [UzbekPaymentMethod.PAYME]: "Payme to'lov tizimi",
    [UzbekPaymentMethod.UZCARD]: 'Uzcard bank kartasi',
    [UzbekPaymentMethod.HUMO]: 'Humo bank kartasi',
    [UzbekPaymentMethod.CASH_ON_DELIVERY]: "Yetkazib berganda to'lash",
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // Buyurtma ma'lumotlarini API ga yuborish
      const orderData: OrderData = {
        id: `UZ${Date.now()}`,
        items: cartItems,
        total,
        paymentMethod,
        deliveryAddress,
        status: 'pending',
      };

      // API chaqirish simulatsiyasi
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Click/Payme to'lov sahifasiga yo'naltirish
      if (paymentMethod === UzbekPaymentMethod.CLICK) {
        // Click API integration
        window.open(
          `https://my.click.uz/services/pay?service_id=12345&merchant_id=67890&amount=${total}&transaction_param=${orderData.id}`,
          '_blank'
        );
      } else if (paymentMethod === UzbekPaymentMethod.PAYME) {
        // Payme API integration
        window.open(
          `https://checkout.paycom.uz/${btoa(
            JSON.stringify({
              merchant: 'payme_merchant_id',
              amount: total * 100, // Payme tiyin'da ishlaydi
              account: { order_id: orderData.id },
            })
          )}`,
          '_blank'
        );
      }

      setOrderId(orderData.id);
      setOrderComplete(true);
      dispatch(clearCart());
    } catch (error) {
      // Error should be handled through proper error boundary or notification system
      alert("Buyurtma yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsProcessing(false);
    }
  };

  const validateForm = () => {
    return (
      customerInfo.firstName &&
      customerInfo.lastName &&
      customerInfo.phone &&
      deliveryAddress.region &&
      deliveryAddress.district &&
      deliveryAddress.street &&
      deliveryAddress.house
    );
  };

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyurtma qabul qilindi!</h2>
          <p className="text-gray-600 mb-4">
            Buyurtma raqami: <span className="font-semibold">{orderId}</span>
          </p>
          <p className="text-gray-600 mb-6">
            Tez orada siz bilan bog'lanamiz va buyurtma holatini SMS orqali xabar qilamiz.
          </p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Bosh sahifaga qaytish
          </a>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Savatingiz bo'sh</h2>
          <p className="text-gray-600 mb-8">Xarid qilish uchun mahsulotlar qo'shing</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Xaridni boshlash
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Buyurtmani tasdiqlash</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Forms */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Shaxsiy ma'lumotlar</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ism</label>
                <input
                  type="text"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ismingizni kiriting"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Familiya</label>
                <input
                  type="text"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Familiyangizni kiriting"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Telefon raqam</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="+998 xx xxx xx xx"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Email (ixtiyoriy)</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Yetkazib berish manzili</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Viloyat *</label>
                <select
                  value={deliveryAddress.region}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, region: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Viloyatni tanlang</option>
                  {uzbekRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tuman/Shahar *</label>
                <input
                  type="text"
                  value={deliveryAddress.district}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, district: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Tuman yoki shaharni kiriting"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mahalla</label>
                <input
                  type="text"
                  value={deliveryAddress.mahalla}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, mahalla: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Mahalla nomini kiriting"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ko'cha *</label>
                  <input
                    type="text"
                    value={deliveryAddress.street}
                    onChange={(e) =>
                      setDeliveryAddress({ ...deliveryAddress, street: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ko'cha nomi"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Uy raqami *</label>
                  <input
                    type="text"
                    value={deliveryAddress.house}
                    onChange={(e) =>
                      setDeliveryAddress({ ...deliveryAddress, house: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Uy raqami"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Qo'shimcha ma'lumot</label>
                <textarea
                  value={deliveryAddress.deliveryInstructions}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, deliveryInstructions: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Masalan: 2-qavat, qo'ng'iroq qiling"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">To'lov usuli</h2>

            <div className="space-y-3">
              {Object.values(UzbekPaymentMethod).map((method) => (
                <label key={method} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value as UzbekPaymentMethod)}
                    className="text-blue-600"
                  />
                  <div className="flex items-center space-x-2">
                    <span>{paymentMethodLabels[method]}</span>
                    {method === UzbekPaymentMethod.CASH_ON_DELIVERY && (
                      <span className="text-sm text-gray-500">(Eng mashhur)</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === UzbekPaymentMethod.CASH_ON_DELIVERY && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Yetkazib berganda to'lash uchun aniq pul tayyorlab qo'ying.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Buyurtma xulosasi</h2>

            {/* Order Items */}
            <div className="space-y-3 mb-6">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-gray-600 text-sm">
                      {item.quantity} × {formatUZSPrice(item.price)}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatUZSPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Mahsulotlar:</span>
                <span>{formatUZSPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Yetkazib berish:</span>
                <span>{formatUZSPrice(deliveryFee)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Jami:</span>
                  <span>{formatUZSPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!validateForm() || isProcessing}
              className={`w-full py-3 rounded-lg mt-6 font-semibold transition-colors ${
                validateForm() && !isProcessing
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Buyurtma yaratilmoqda...' : 'Buyurtmani tasdiqlash'}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Buyurtmani tasdiqlash orqali siz{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                foydalanish shartlari
              </a>
              ni qabul qilasiz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
