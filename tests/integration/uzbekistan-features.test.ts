import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { UzbekPaymentMethod } from '../../packages/shared/src/constants';
import {
  validateUzbekPhone,
  validateUzbekAddress,
} from '../../packages/shared/src/utils/uzbek-validation';
import { UzbekAddressType } from '../../packages/shared/src/utils/uzbek-validation';

// Test server setup
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe("UltraMarket O'zbekiston Integration Tests", () => {
  let authToken: string;
  let testUserId: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Test foydalanuvchisini yaratish va autentifikatsiya
    const registerResponse = await request(API_BASE_URL)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@ultramarket.uz',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+998901234567',
        address: {
          type: 'HOME',
          region: 'Toshkent shahri',
          district: "Mirzo Ulug'bek",
          mahalla: 'Qorasaroy',
          street: "Amir Temur ko'chasi",
          house: '1',
          apartment: '5',
          postalCode: '100000',
          landmark: 'Metro bekati yonida',
          deliveryInstructions: 'Test uchun',
        },
      });

    expect(registerResponse.status).toBe(201);
    testUserId = registerResponse.body.data.user.id;
    authToken = registerResponse.body.data.token;
  });

  afterAll(async () => {
    // Test ma'lumotlarini tozalash
    if (testUserId) {
      await request(API_BASE_URL)
        .delete(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe("O'zbek Telefon Raqamlari Validatsiyasi", () => {
    it("to'g'ri O'zbek telefon raqamini qabul qilishi kerak", () => {
      const validPhones = [
        '+998901234567',
        '+998911234567',
        '+998931234567',
        '+998941234567',
        '+998951234567',
        '+998971234567',
        '+998991234567',
      ];

      validPhones.forEach((phone) => {
        expect(validateUzbekPhone(phone)).toBe(true);
      });
    });

    it("noto'g'ri telefon raqamlarini rad etishi kerak", () => {
      const invalidPhones = [
        '+998801234567', // noto'g'ri operator kodi
        '+998901234', // qisqa raqam
        '998901234567', // + belgisisiz
        '+7901234567', // boshqa davlat kodi
        '+99890123456789', // uzun raqam
      ];

      invalidPhones.forEach((phone) => {
        expect(validateUzbekPhone(phone)).toBe(false);
      });
    });

    it("User Service telefon validatsiyasini sinovdan o'tkazish", async () => {
      const validPhoneUpdate = await request(API_BASE_URL)
        .patch(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '+998901234567',
        });

      expect(validPhoneUpdate.status).toBe(200);

      const invalidPhoneUpdate = await request(API_BASE_URL)
        .patch(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '+1234567890',
        });

      expect(invalidPhoneUpdate.status).toBe(400);
      expect(invalidPhoneUpdate.body.error).toContain('telefon raqami');
    });
  });

  describe("O'zbek Manzil Tizimi", () => {
    it("to'g'ri O'zbek manzilini validatsiya qilishi kerak", () => {
      const validAddress: UzbekAddressType = {
        type: 'HOME' as const,
        region: 'Toshkent shahri',
        district: 'Yashnobod',
        mahalla: 'Qorasaroy',
        street: "Mustaqillik ko'chasi",
        house: '15',
        apartment: '25',
        postalCode: '100000',
        landmark: "Do'kon yonida",
        deliveryInstructions: 'Ikkinchi qavat',
      };

      expect(validateUzbekAddress(validAddress)).toBe(true);
    });

    it("to'liq bo'lmagan manzilni rad etishi kerak", () => {
      const incompleteAddress = {
        type: 'HOME' as const,
        region: 'Toshkent shahri',
        // district yo'q
        street: "Test ko'chasi",
        house: '1',
      };

      expect(validateUzbekAddress(incompleteAddress as UzbekAddressType)).toBe(false);
    });

    it('User manzilini yangilash API testlari', async () => {
      const updateResponse = await request(API_BASE_URL)
        .patch(`/api/v1/users/${testUserId}/address`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'WORK',
          region: 'Samarqand',
          district: 'Registon',
          mahalla: 'Bibi Xonim',
          street: "Sharof Rashidov ko'chasi",
          house: '10',
          apartment: '3',
          postalCode: '140000',
          landmark: 'Registon yonida',
          deliveryInstructions: 'Ish joyiga yetkazib bering',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.address.region).toBe('Samarqand');
    });
  });

  describe("O'zbek To'lov Tizimlari", () => {
    beforeEach(async () => {
      // Test uchun savatga mahsulot qo'shish
      await request(API_BASE_URL)
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'test-product-1',
          quantity: 2,
          price: 150000, // 150,000 so'm
        });
    });

    it("Click to'lov tizimi orqali buyurtma yaratish", async () => {
      const orderResponse = await request(API_BASE_URL)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: UzbekPaymentMethod.CLICK,
          deliveryAddress: {
            type: 'HOME',
            region: 'Toshkent shahri',
            district: 'Chilonzor',
            mahalla: 'Katartal',
            street: "Bunyodkor ko'chasi",
            house: '5',
            apartment: '12',
            postalCode: '100000',
          },
          items: [
            {
              productId: 'test-product-1',
              quantity: 2,
              price: 150000,
            },
          ],
        });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.data.paymentMethod).toBe(UzbekPaymentMethod.CLICK);
      expect(orderResponse.body.data.currency).toBe('UZS');
      testOrderId = orderResponse.body.data.id;
    });

    it("Payme to'lov tizimi orqali buyurtma yaratish", async () => {
      const orderResponse = await request(API_BASE_URL)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: UzbekPaymentMethod.PAYME,
          deliveryAddress: {
            type: 'HOME',
            region: 'Toshkent viloyati',
            district: 'Angren',
            mahalla: 'Markaziy',
            street: "Mustaqillik ko'chasi",
            house: '8',
            postalCode: '111500',
          },
          items: [
            {
              productId: 'test-product-2',
              quantity: 1,
              price: 500000,
            },
          ],
        });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.data.paymentMethod).toBe(UzbekPaymentMethod.PAYME);
    });

    it("Yetkazib berganda to'lash usuli", async () => {
      const orderResponse = await request(API_BASE_URL)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: UzbekPaymentMethod.CASH_ON_DELIVERY,
          deliveryAddress: {
            type: 'HOME',
            region: 'Buxoro',
            district: 'Buxoro shahri',
            mahalla: 'Ark yonidagi',
            street: "Aloviddin ko'chasi",
            house: '25',
            postalCode: '200100',
          },
          items: [
            {
              productId: 'test-product-3',
              quantity: 3,
              price: 75000,
            },
          ],
        });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.data.paymentMethod).toBe(UzbekPaymentMethod.CASH_ON_DELIVERY);
      expect(orderResponse.body.data.status).toBe('pending');
    });

    it('Click webhook testlari', async () => {
      // Click webhook simulatsiyasi
      const webhookResponse = await request(API_BASE_URL)
        .post('/api/v1/payments/webhooks/click')
        .send({
          click_trans_id: 'test_click_123456',
          service_id: 'test_service_id',
          click_paydoc_id: 'test_paydoc_123',
          merchant_trans_id: testOrderId,
          amount: 300000,
          action: 1, // Payment successful
          error: 0,
          error_note: 'SUCCESS',
          sign_time: new Date().toISOString(),
          sign_string: 'test_signature',
        });

      expect(webhookResponse.status).toBe(200);
    });

    it('Payme webhook testlari', async () => {
      // Payme webhook simulatsiyasi
      const webhookResponse = await request(API_BASE_URL)
        .post('/api/v1/payments/webhooks/payme')
        .send({
          method: 'CheckPerformTransaction',
          params: {
            amount: 30000000, // Payme tiyin'da ishlaydi
            account: {
              order_id: testOrderId,
            },
          },
        });

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.body.result).toBeDefined();
    });
  });

  describe("O'zbek Yetkazib Berish Tizimlari", () => {
    it('Express24 yetkazib berish narxini hisoblash', async () => {
      const shippingResponse = await request(API_BASE_URL)
        .post('/api/v1/shipping/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'EXPRESS24',
          fromRegion: 'Toshkent shahri',
          toRegion: 'Samarqand',
          weight: 2.5,
          dimensions: {
            length: 30,
            width: 20,
            height: 15,
          },
        });

      expect(shippingResponse.status).toBe(200);
      expect(shippingResponse.body.data.provider).toBe('EXPRESS24');
      expect(shippingResponse.body.data.cost).toBeGreaterThan(0);
      expect(shippingResponse.body.data.currency).toBe('UZS');
    });

    it('Uzbekiston Post yetkazib berish narxini hisoblash', async () => {
      const shippingResponse = await request(API_BASE_URL)
        .post('/api/v1/shipping/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'UZPOST',
          fromRegion: 'Toshkent shahri',
          toRegion: "Qoraqalpog'iston",
          weight: 1.0,
          dimensions: {
            length: 25,
            width: 15,
            height: 10,
          },
        });

      expect(shippingResponse.status).toBe(200);
      expect(shippingResponse.body.data.provider).toBe('UZPOST');
      expect(shippingResponse.body.data.estimatedDays).toBeGreaterThan(0);
    });

    it('Yetkazib berish tracking testlari', async () => {
      const trackingResponse = await request(API_BASE_URL)
        .get('/api/v1/shipping/track/EX24123456789UZ')
        .set('Authorization', `Bearer ${authToken}`);

      expect(trackingResponse.status).toBe(200);
      expect(trackingResponse.body.data.trackingNumber).toBe('EX24123456789UZ');
      expect(trackingResponse.body.data.status).toBeDefined();
    });
  });

  describe('Valyuta va Narx Formatlash', () => {
    it("UZS valyutasida narxlarni to'g'ri ko'rsatish", async () => {
      const productsResponse = await request(API_BASE_URL)
        .get('/api/v1/products')
        .query({ currency: 'UZS' });

      expect(productsResponse.status).toBe(200);

      const products = productsResponse.body.data.products;
      products.forEach((product: any) => {
        expect(product.currency).toBe('UZS');
        expect(product.price).toBeGreaterThan(0);
        expect(typeof product.formattedPrice).toBe('string');
        expect(product.formattedPrice).toContain("so'm");
      });
    });

    it('QQS (12%) hisoblanganligini tekshirish', async () => {
      const orderResponse = await request(API_BASE_URL)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(orderResponse.status).toBe(200);

      const order = orderResponse.body.data;
      expect(order.taxRate).toBe(0.12);
      expect(order.taxAmount).toBeGreaterThan(0);
      expect(order.totalWithTax).toBe(order.subtotal + order.taxAmount + order.deliveryFee);
    });
  });

  describe('Lokalizatsiya va Til Testlari', () => {
    it("O'zbekcha til interfeysi", async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/config/localization')
        .query({ lang: 'uz' });

      expect(response.status).toBe(200);
      expect(response.body.data.language).toBe('uz');
      expect(response.body.data.translations).toBeDefined();
      expect(response.body.data.translations.welcomeMessage).toBe('Xush kelibsiz');
    });

    it('Ruscha til interfeysi', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/config/localization')
        .query({ lang: 'ru' });

      expect(response.status).toBe(200);
      expect(response.body.data.language).toBe('ru');
      expect(response.body.data.translations.welcomeMessage).toBe('Добро пожаловать');
    });

    it('Inglizcha til interfeysi', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/config/localization')
        .query({ lang: 'en' });

      expect(response.status).toBe(200);
      expect(response.body.data.language).toBe('en');
      expect(response.body.data.translations.welcomeMessage).toBe('Welcome');
    });
  });

  describe("O'zbekiston Vaqt Zonasi", () => {
    it('Toshkent vaqt zonasida sana/vaqt', async () => {
      const timeResponse = await request(API_BASE_URL).get('/api/v1/config/time');

      expect(timeResponse.status).toBe(200);
      expect(timeResponse.body.data.timezone).toBe('Asia/Tashkent');
      expect(timeResponse.body.data.currentTime).toBeDefined();

      const currentTime = new Date(timeResponse.body.data.currentTime);
      expect(currentTime).toBeInstanceOf(Date);
    });

    it('Buyurtmalar Toshkent vaqti bilan yaratilishi', async () => {
      const orderResponse = await request(API_BASE_URL)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(orderResponse.status).toBe(200);

      const order = orderResponse.body.data;
      const createdAt = new Date(order.createdAt);

      // Toshkent vaqt zonasida (+05:00 UTC)
      const tashkentOffset = 5 * 60; // minutes
      const expectedOffset = createdAt.getTimezoneOffset() + tashkentOffset;

      expect(Math.abs(expectedOffset)).toBeLessThanOrEqual(60); // 1 soat farq
    });
  });

  describe('SMS Bildirishnomalar (Eskiz.uz)', () => {
    it('Buyurtma tasdiqlanganida SMS yuborish', async () => {
      const smsResponse = await request(API_BASE_URL)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '+998901234567',
          message: 'Buyurtmangiz qabul qilindi. Raqam: ' + testOrderId,
          type: 'order_confirmation',
        });

      expect(smsResponse.status).toBe(200);
      expect(smsResponse.body.data.provider).toBe('ESKIZ');
      expect(smsResponse.body.data.status).toBe('sent');
    });

    it('Yetkazib berish holati haqida SMS', async () => {
      const smsResponse = await request(API_BASE_URL)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '+998901234567',
          message: "Buyurtmangiz yo'lda. Track: EX24123456789UZ",
          type: 'delivery_status',
        });

      expect(smsResponse.status).toBe(200);
    });
  });

  describe("Regional Ma'lumotlar", () => {
    it("O'zbekiston viloyatlari ro'yxati", async () => {
      const regionsResponse = await request(API_BASE_URL).get('/api/v1/config/regions');

      expect(regionsResponse.status).toBe(200);

      const regions = regionsResponse.body.data.regions;
      expect(regions).toHaveLength(14); // 14 ta viloyat va respublika

      const tashkent = regions.find((r: any) => r.code === 'TSH');
      expect(tashkent).toBeDefined();
      expect(tashkent.name_uz).toBe('Toshkent shahri');
      expect(tashkent.deliveryFee).toBeDefined();
    });

    it('Pochta kodlari validatsiyasi', async () => {
      const validationResponse = await request(API_BASE_URL)
        .post('/api/v1/validation/postal-code')
        .send({
          postalCode: '100000',
          region: 'Toshkent shahri',
        });

      expect(validationResponse.status).toBe(200);
      expect(validationResponse.body.data.isValid).toBe(true);
    });
  });

  describe('Performance va Kesh', () => {
    it('Mahsulotlar keshi UZS narxlari bilan', async () => {
      // Birinchi so'rov
      const startTime = Date.now();
      const firstResponse = await request(API_BASE_URL)
        .get('/api/v1/products/featured')
        .query({ currency: 'UZS' });
      const firstResponseTime = Date.now() - startTime;

      expect(firstResponse.status).toBe(200);

      // Ikkinchi so'rov (keshdan)
      const secondStartTime = Date.now();
      const secondResponse = await request(API_BASE_URL)
        .get('/api/v1/products/featured')
        .query({ currency: 'UZS' });
      const secondResponseTime = Date.now() - secondStartTime;

      expect(secondResponse.status).toBe(200);
      expect(secondResponseTime).toBeLessThan(firstResponseTime);
    });
  });
});

// Yordamchi funktsiyalar
function generateUzbekPhoneNumber(): string {
  const operators = ['90', '91', '93', '94', '95', '97', '99'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0');
  return `+998${operator}${number}`;
}

function generateRandomOrderId(): string {
  return `UZ${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export { generateUzbekPhoneNumber, generateRandomOrderId };
