import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UzbekPaymentMethod } from '../../../libs/shared/src/constants';
import { formatUZSPrice } from '../../../libs/shared/src/utils';
import PaymentAPI from '../services/PaymentAPI';

interface PaymentMethod {
  id: UzbekPaymentMethod;
  name: string;
  description: string;
  icon: any;
  fee: number;
  enabled: boolean;
  processingTime: string;
}

interface OrderData {
  id: string;
  total: number;
  currency: string;
  items: any[];
}

const { width } = Dimensions.get('window');

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderData } = route.params as { orderData: OrderData };

  const [selectedPayment, setSelectedPayment] = useState<UzbekPaymentMethod>(
    UzbekPaymentMethod.CLICK
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLanguage, setUserLanguage] = useState('uz');

  const paymentMethods: PaymentMethod[] = [
    {
      id: UzbekPaymentMethod.CLICK,
      name: userLanguage === 'uz' ? "Click to'lov tizimi" : 'Платежная система Click',
      description:
        userLanguage === 'uz'
          ? "Tezkor va xavfsiz to'lov Click ilovasi orqali"
          : 'Быстрая и безопасная оплата через приложение Click',
      icon: require('../assets/icons/click-logo.png'),
      fee: 0.5,
      enabled: true,
      processingTime: userLanguage === 'uz' ? 'Bir zumda' : 'Мгновенно',
    },
    {
      id: UzbekPaymentMethod.PAYME,
      name: userLanguage === 'uz' ? "Payme to'lov tizimi" : 'Платежная система Payme',
      description:
        userLanguage === 'uz'
          ? "Payme ilovasi orqali qulay to'lov"
          : 'Удобная оплата через приложение Payme',
      icon: require('../assets/icons/payme-logo.png'),
      fee: 0.5,
      enabled: true,
      processingTime: userLanguage === 'uz' ? 'Bir zumda' : 'Мгновенно',
    },
    {
      id: UzbekPaymentMethod.UZCARD,
      name: userLanguage === 'uz' ? 'Uzcard bank kartasi' : 'Банковская карта Uzcard',
      description:
        userLanguage === 'uz'
          ? "Mahalliy Uzcard kartasi bilan to'lov"
          : 'Оплата местной картой Uzcard',
      icon: require('../assets/icons/uzcard-logo.png'),
      fee: 1.0,
      enabled: true,
      processingTime: userLanguage === 'uz' ? '2-3 daqiqa' : '2-3 минуты',
    },
    {
      id: UzbekPaymentMethod.HUMO,
      name: userLanguage === 'uz' ? 'Humo bank kartasi' : 'Банковская карта Humo',
      description:
        userLanguage === 'uz'
          ? "Humo kartasi bilan xavfsiz to'lov"
          : 'Безопасная оплата картой Humo',
      icon: require('../assets/icons/humo-logo.png'),
      fee: 1.0,
      enabled: true,
      processingTime: userLanguage === 'uz' ? '2-3 daqiqa' : '2-3 минуты',
    },
    {
      id: UzbekPaymentMethod.CASH_ON_DELIVERY,
      name: userLanguage === 'uz' ? "Yetkazib berganda to'lash" : 'Оплата при доставке',
      description:
        userLanguage === 'uz'
          ? "Mahsulotni qabul qilganingizda to'lang"
          : 'Оплачивайте при получении товара',
      icon: require('../assets/icons/cash-icon.png'),
      fee: 0,
      enabled: true,
      processingTime: userLanguage === 'uz' ? 'Yetkazib berishda' : 'При доставке',
    },
  ];

  useEffect(() => {
    loadUserLanguage();
  }, []);

  const loadUserLanguage = async () => {
    try {
      const language = await AsyncStorage.getItem('userLanguage');
      if (language) {
        setUserLanguage(language);
      }
    } catch (error) {
      // Language loading error should be handled through proper error handling
    }
  };

  const calculateFee = (paymentMethod: UzbekPaymentMethod): number => {
    const method = paymentMethods.find((m) => m.id === paymentMethod);
    if (!method) return 0;

    const feeAmount = orderData.total * (method.fee / 100);
    return Math.round(feeAmount);
  };

  const calculateTotal = (): number => {
    const fee = calculateFee(selectedPayment);
    return orderData.total + fee;
  };

  const handlePaymentMethodSelect = (method: UzbekPaymentMethod) => {
    setSelectedPayment(method);
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      switch (selectedPayment) {
        case UzbekPaymentMethod.CLICK:
          await handleClickPayment();
          break;
        case UzbekPaymentMethod.PAYME:
          await handlePaymePayment();
          break;
        case UzbekPaymentMethod.UZCARD:
        case UzbekPaymentMethod.HUMO:
          await handleCardPayment();
          break;
        case UzbekPaymentMethod.CASH_ON_DELIVERY:
          await handleCashOnDelivery();
          break;
      }
    } catch (error) {
      Alert.alert(
        userLanguage === 'uz' ? 'Xatolik' : 'Ошибка',
        userLanguage === 'uz'
          ? "To'lov jarayonida xatolik yuz berdi. Qaytadan urinib ko'ring."
          : 'Произошла ошибка при оплате. Попробуйте еще раз.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClickPayment = async () => {
    try {
      const response = await PaymentAPI.createClickPayment({
        orderId: orderData.id,
        amount: calculateTotal(),
        description:
          userLanguage === 'uz' ? "UltraMarket buyurtma to'lovi" : 'Оплата заказа UltraMarket',
      });

      if (response.success) {
        // Click ilovasini ochish
        const clickUrl = response.data.paymentUrl;
        const canOpen = await Linking.canOpenURL(clickUrl);

        if (canOpen) {
          await Linking.openURL(clickUrl);
          // Payment success screen ga o'tish
          navigation.navigate('PaymentSuccess', {
            orderId: orderData.id,
            paymentMethod: 'Click',
          });
        } else {
          // Browser orqali ochish
          await Linking.openURL(clickUrl);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handlePaymePayment = async () => {
    try {
      const response = await PaymentAPI.createPaymePayment({
        orderId: orderData.id,
        amount: calculateTotal(),
        description:
          userLanguage === 'uz' ? "UltraMarket buyurtma to'lovi" : 'Оплата заказа UltraMarket',
      });

      if (response.success) {
        // Payme ilovasini ochish
        const paymeUrl = response.data.paymentUrl;
        const canOpen = await Linking.canOpenURL(paymeUrl);

        if (canOpen) {
          await Linking.openURL(paymeUrl);
          navigation.navigate('PaymentSuccess', {
            orderId: orderData.id,
            paymentMethod: 'Payme',
          });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCardPayment = async () => {
    // Card payment screen ga o'tish
    navigation.navigate('CardPayment', {
      orderData,
      paymentMethod: selectedPayment,
      total: calculateTotal(),
    });
  };

  const handleCashOnDelivery = async () => {
    try {
      const response = await PaymentAPI.confirmOrder({
        orderId: orderData.id,
        paymentMethod: UzbekPaymentMethod.CASH_ON_DELIVERY,
        total: orderData.total,
      });

      if (response.success) {
        Alert.alert(
          userLanguage === 'uz' ? 'Buyurtma qabul qilindi!' : 'Заказ принят!',
          userLanguage === 'uz'
            ? "Buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada siz bilan bog'lanamiz."
            : 'Ваш заказ успешно принят. Мы свяжемся с вами в ближайшее время.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('OrderTracking', {
                  orderId: orderData.id,
                }),
            },
          ]
        );
      }
    } catch (error) {
      throw error;
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isSelected = selectedPayment === method.id;
    const fee = calculateFee(method.id);

    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.paymentMethodCard, isSelected && styles.selectedPaymentMethod]}
        onPress={() => handlePaymentMethodSelect(method.id)}
        disabled={!method.enabled}
      >
        <View style={styles.paymentMethodHeader}>
          <Image source={method.icon} style={styles.paymentIcon} />
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>{method.name}</Text>
            <Text style={styles.paymentMethodDescription}>{method.description}</Text>
            <Text style={styles.processingTime}>
              {userLanguage === 'uz' ? 'Vaqt: ' : 'Время: '}
              {method.processingTime}
            </Text>
          </View>
          <View style={styles.paymentMethodMeta}>
            {fee > 0 && <Text style={styles.feeText}>+{formatUZSPrice(fee)}</Text>}
            <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </View>

        {method.id === UzbekPaymentMethod.CASH_ON_DELIVERY && (
          <View style={styles.cashWarning}>
            <Text style={styles.cashWarningText}>
              ⚠️{' '}
              {userLanguage === 'uz'
                ? "Yetkazib berganda aniq pul tayyorlab qo'ying"
                : 'Подготовьте точную сумму при доставке'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {userLanguage === 'uz' ? "To'lov usuli" : 'Способ оплаты'}
          </Text>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.orderSummaryTitle}>
            {userLanguage === 'uz' ? 'Buyurtma xulosasi' : 'Сводка заказа'}
          </Text>
          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>
              {userLanguage === 'uz' ? 'Mahsulotlar:' : 'Товары:'}
            </Text>
            <Text style={styles.orderSummaryValue}>{formatUZSPrice(orderData.total)}</Text>
          </View>
          {calculateFee(selectedPayment) > 0 && (
            <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>
                {userLanguage === 'uz' ? "To'lov komissiyasi:" : 'Комиссия:'}
              </Text>
              <Text style={styles.orderSummaryValue}>
                {formatUZSPrice(calculateFee(selectedPayment))}
              </Text>
            </View>
          )}
          <View style={[styles.orderSummaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{userLanguage === 'uz' ? 'Jami:' : 'Итого:'}</Text>
            <Text style={styles.totalValue}>{formatUZSPrice(calculateTotal())}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>
            {userLanguage === 'uz' ? "To'lov usulini tanlang" : 'Выберите способ оплаты'}
          </Text>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>
            🔒 {userLanguage === 'uz' ? 'Xavfsizlik' : 'Безопасность'}
          </Text>
          <Text style={styles.securityText}>
            {userLanguage === 'uz'
              ? "Barcha to'lovlar SSL shifrlash bilan himoyalangan va O'zbekiston Markaziy bankining standartlariga mos keladi."
              : 'Все платежи защищены SSL-шифрованием и соответствуют стандартам Центрального банка Узбекистана.'}
          </Text>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          <Text style={styles.payButtonText}>
            {isProcessing
              ? userLanguage === 'uz'
                ? 'Jarayon davom etmoqda...'
                : 'Обработка...'
              : userLanguage === 'uz'
                ? "To'lovni tasdiqlash"
                : 'Подтвердить оплату'}
          </Text>
          <Text style={styles.payButtonAmount}>{formatUZSPrice(calculateTotal())}</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          {userLanguage === 'uz'
            ? "To'lovni tasdiqlash orqali siz "
            : 'Подтверждая оплату, вы соглашаетесь с '}
          <Text style={styles.termsLink}>
            {userLanguage === 'uz' ? 'foydalanish shartlari' : 'условиями использования'}
          </Text>
          {userLanguage === 'uz' ? 'ni qabul qilasiz' : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderSummaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  paymentMethodsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPaymentMethod: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  processingTime: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  paymentMethodMeta: {
    alignItems: 'flex-end',
  },
  feeText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007bff',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  cashWarning: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  cashWarningText: {
    fontSize: 12,
    color: '#856404',
  },
  securityInfo: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#155724',
    lineHeight: 16,
  },
  bottomSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  payButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  payButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  payButtonAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default PaymentScreen;
