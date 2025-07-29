import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateQuantity, removeFromCart, clearCart } from '../store/slices/cartSlice';
// Temporarily disabled shared imports
// import { UzbekPaymentMethod, formatUZSPrice } from '../../../../libs/shared/src/constants';
// import { UzbekAddressType } from '../../../../libs/shared/src/types/uzbek-address';

// Temporary type definitions and functions
enum UzbekPaymentMethod {
  CLICK = 'click',
  PAYME = 'payme',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

const formatUZSPrice = (price: number): string => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
  }).format(price);
};

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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const CartPage: React.FC = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<UzbekPaymentMethod>(
    UzbekPaymentMethod.CLICK
  );
  const [deliveryAddress, setDeliveryAddress] = useState<Partial<UzbekAddressType>>({
    region: '',
    district: '',
    mahalla: '',
    street: '',
    house: '',
    apartment: '',
    landmark: '',
    deliveryInstructions: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 25000; // 25,000 so'm
  const total = subtotal + deliveryFee;

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeFromCart(id));
    } else {
      dispatch(updateQuantity({ id, quantity }));
    }
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleProceedToCheckout = () => {
    // Checkout sahifasiga o'tish
    // Track checkout initiation through analytics service
    // Validate and proceed to checkout with cart data
  };

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
      <h1 className="text-3xl font-bold mb-8">Xarid savati</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tanlangan mahsulotlar</h2>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-4 mb-4 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-600">{formatUZSPrice(item.price)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => dispatch(clearCart())}
              className="text-red-600 hover:text-red-800 mt-4"
            >
              Barcha mahsulotlarni o'chirish
            </button>
          </div>
        </div>

        {/* Order Summary & Delivery */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Yetkazib berish manzili</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Viloyat</label>
                <select
                  value={deliveryAddress.region}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, region: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Tuman/Shahar</label>
                <input
                  type="text"
                  value={deliveryAddress.district}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, district: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Tuman yoki shaharni kiriting"
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

              <div>
                <label className="block text-sm font-medium mb-1">Ko'cha va uy raqami</label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, street: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ko'cha nomi"
                />
                <input
                  type="text"
                  value={deliveryAddress.house}
                  onChange={(e) =>
                    setDeliveryAddress({ ...deliveryAddress, house: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-2"
                  placeholder="Uy raqami"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Yetkazib berish uchun qo'shimcha ma'lumot
                </label>
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
            <h3 className="text-lg font-semibold mb-4">To'lov usuli</h3>

            <div className="space-y-3">
              {Object.values(UzbekPaymentMethod).map((method) => (
                <label key={method} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={method}
                    checked={selectedPaymentMethod === method}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as UzbekPaymentMethod)}
                    className="text-blue-600"
                  />
                  <span>{paymentMethodLabels[method]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Buyurtma xulosasi</h3>

            <div className="space-y-2">
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

            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 font-semibold"
            >
              Buyurtmani tasdiqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
