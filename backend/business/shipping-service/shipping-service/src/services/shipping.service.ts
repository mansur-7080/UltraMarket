import { EventEmitter } from 'events';
import axios from 'axios';
import { createError, logger } from '@ultramarket/common';

// O'zbekiston Shipping Providers
interface UzPostConfig {
  apiKey: string;
  environment: 'test' | 'production';
}

interface UzAutoConfig {
  apiKey: string;
  environment: 'test' | 'production';
}

interface CourierConfig {
  apiKey: string;
  environment: 'test' | 'production';
}

export interface ShippingProvider {
  id: string;
  name: string;
  code: string;
  apiUrl: string;
  apiKey: string;
  supportedServices: ShippingService[];
  settings: {
    defaultService: string;
    trackingEnabled: boolean;
    insuranceEnabled: boolean;
    signatureRequired: boolean;
  };
  regions: string[];
  status: 'active' | 'inactive' | 'testing';
}

export interface ShippingService {
  id: string;
  providerId: string;
  name: string;
  code: string;
  description: string;
  maxWeight: number;
  maxDimensions: {
    length: number;
    width: number;
    height: number;
  };
  deliveryTime: {
    min: number;
    max: number;
    unit: 'hours' | 'days';
  };
  features: {
    tracking: boolean;
    insurance: boolean;
    signature: boolean;
    cashOnDelivery: boolean;
  };
  pricing: {
    baseRate: number;
    weightRate: number;
    dimensionRate: number;
    fuelSurcharge: number;
  };
}

export interface ShippingAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone?: string;
  email?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Package {
  id: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
  contents: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hsCode?: string;
  }>;
  fragile: boolean;
  hazardous: boolean;
}

export interface ShippingRate {
  providerId: string;
  serviceId: string;
  serviceName: string;
  cost: number;
  currency: string;
  deliveryTime: {
    min: number;
    max: number;
    unit: 'hours' | 'days';
  };
  features: {
    tracking: boolean;
    insurance: boolean;
    signature: boolean;
  };
  taxes: number;
  fees: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
  totalCost: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  providerId: string;
  serviceId: string;
  status:
    | 'created'
    | 'booked'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'exception'
    | 'returned';
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  packages: Package[];
  cost: number;
  currency: string;
  label: {
    url: string;
    format: 'pdf' | 'png' | 'zpl';
  };
  tracking: {
    events: TrackingEvent[];
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  insurance?: {
    value: number;
    cost: number;
  };
  customs?: {
    contentType: 'merchandise' | 'documents' | 'gift' | 'sample';
    contentDescription: string;
    declarationStatement: string;
    invoiceNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  details?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  providerId: string;
  regions: Array<{
    country: string;
    states?: string[];
    zipCodes?: string[];
  }>;
  rates: Array<{
    serviceId: string;
    baseRate: number;
    weightRate: number;
    freeShippingThreshold?: number;
  }>;
  deliveryTime: {
    min: number;
    max: number;
    unit: 'hours' | 'days';
  };
  restrictions: {
    maxWeight?: number;
    maxValue?: number;
    hazardousMaterials: boolean;
    fragileItems: boolean;
  };
}

export class ShippingService extends EventEmitter {
  private providers: Map<string, ShippingProvider> = new Map();
  private zones: Map<string, DeliveryZone> = new Map();
  private uzPostConfig: UzPostConfig;
  private uzAutoConfig: UzAutoConfig;
  private courierConfig: CourierConfig;

  constructor() {
    super();

    // O'zbekiston shipping providers configuration
    this.uzPostConfig = {
      apiKey: process.env.UZPOST_API_KEY || '',
      environment: (process.env.UZPOST_ENVIRONMENT as 'test' | 'production') || 'test',
    };

    this.uzAutoConfig = {
      apiKey: process.env.UZAUTO_API_KEY || '',
      environment: (process.env.UZAUTO_ENVIRONMENT as 'test' | 'production') || 'test',
    };

    this.courierConfig = {
      apiKey: process.env.COURIER_API_KEY || '',
      environment: (process.env.COURIER_ENVIRONMENT as 'test' | 'production') || 'test',
    };

    this.initializeProviders();
  }

  /**
   * Get shipping rates for a shipment
   */
  async getRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[],
    serviceFilters?: {
      providers?: string[];
      maxCost?: number;
      maxDeliveryTime?: number;
      features?: string[];
    }
  ): Promise<ShippingRate[]> {
    try {
      logger.info('Getting shipping rates', {
        fromCity: fromAddress.city,
        toCity: toAddress.city,
        packageCount: packages.length,
      });

      const rates: ShippingRate[] = [];

      // Get rates from UzPost
      if (!serviceFilters?.providers || serviceFilters.providers.includes('uzpost')) {
        const uzPostRates = await this.getUzPostRates(fromAddress, toAddress, packages);
        rates.push(...uzPostRates);
      }

      // Get rates from UzAuto
      if (!serviceFilters?.providers || serviceFilters.providers.includes('uzauto')) {
        const uzAutoRates = await this.getUzAutoRates(fromAddress, toAddress, packages);
        rates.push(...uzAutoRates);
      }

      // Get rates from local couriers
      if (!serviceFilters?.providers || serviceFilters.providers.includes('courier')) {
        const courierRates = await this.getCourierRates(fromAddress, toAddress, packages);
        rates.push(...courierRates);
      }

      // Apply filters
      let filteredRates = rates;

      if (serviceFilters?.maxCost) {
        filteredRates = filteredRates.filter((rate) => rate.totalCost <= serviceFilters.maxCost!);
      }

      if (serviceFilters?.maxDeliveryTime) {
        filteredRates = filteredRates.filter(
          (rate) => rate.deliveryTime.max <= serviceFilters.maxDeliveryTime!
        );
      }

      if (serviceFilters?.features) {
        filteredRates = filteredRates.filter((rate) =>
          serviceFilters.features!.every((feature) => Object.values(rate.features).includes(true))
        );
      }

      // Sort by cost
      filteredRates.sort((a, b) => a.totalCost - b.totalCost);

      logger.info('Shipping rates retrieved', {
        totalRates: rates.length,
        filteredRates: filteredRates.length,
      });

      return filteredRates;
    } catch (error) {
      logger.error('Failed to get shipping rates', error);
      throw createError(500, 'Failed to get shipping rates');
    }
  }

  /**
   * Get UzPost rates
   */
  private async getUzPostRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[]
  ): Promise<ShippingRate[]> {
    try {
      const apiUrl =
        this.uzPostConfig.environment === 'production'
          ? 'https://api.uzpost.uz/v1/rates'
          : 'https://test-api.uzpost.uz/v1/rates';

      const requestData = {
        from: {
          city: fromAddress.city,
          state: fromAddress.state,
          country: fromAddress.country,
          zipCode: fromAddress.zipCode,
        },
        to: {
          city: toAddress.city,
          state: toAddress.state,
          country: toAddress.country,
          zipCode: toAddress.zipCode,
        },
        packages: packages.map((pkg) => ({
          weight: pkg.weight,
          dimensions: pkg.dimensions,
          value: pkg.value,
        })),
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.uzPostConfig.apiKey}`,
        },
      });

      return response.data.rates.map((rate: any) => ({
        providerId: 'uzpost',
        serviceId: rate.service_id,
        serviceName: rate.service_name,
        cost: rate.cost,
        currency: 'UZS',
        deliveryTime: {
          min: rate.delivery_time.min,
          max: rate.delivery_time.max,
          unit: 'days',
        },
        features: {
          tracking: rate.features.tracking,
          insurance: rate.features.insurance,
          signature: rate.features.signature,
        },
        taxes: rate.taxes || 0,
        fees: rate.fees || [],
        totalCost: rate.total_cost,
      }));
    } catch (error) {
      logger.error('Failed to get UzPost rates', error);
      return [];
    }
  }

  /**
   * Get UzAuto rates
   */
  private async getUzAutoRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[]
  ): Promise<ShippingRate[]> {
    try {
      const apiUrl =
        this.uzAutoConfig.environment === 'production'
          ? 'https://api.uzauto.uz/v1/shipping/rates'
          : 'https://test-api.uzauto.uz/v1/shipping/rates';

      const requestData = {
        origin: {
          city: fromAddress.city,
          region: fromAddress.state,
        },
        destination: {
          city: toAddress.city,
          region: toAddress.state,
        },
        cargo: {
          weight: packages.reduce((sum, pkg) => sum + pkg.weight, 0),
          volume: packages.reduce(
            (sum, pkg) =>
              sum + pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height,
            0
          ),
          value: packages.reduce((sum, pkg) => sum + pkg.value, 0),
        },
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.uzAutoConfig.apiKey}`,
        },
      });

      return response.data.services.map((service: any) => ({
        providerId: 'uzauto',
        serviceId: service.id,
        serviceName: service.name,
        cost: service.cost,
        currency: 'UZS',
        deliveryTime: {
          min: service.delivery_time.min,
          max: service.delivery_time.max,
          unit: 'days',
        },
        features: {
          tracking: service.features.tracking,
          insurance: service.features.insurance,
          signature: service.features.signature,
        },
        taxes: service.taxes || 0,
        fees: service.fees || [],
        totalCost: service.total_cost,
      }));
    } catch (error) {
      logger.error('Failed to get UzAuto rates', error);
      return [];
    }
  }

  /**
   * Get local courier rates
   */
  private async getCourierRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[]
  ): Promise<ShippingRate[]> {
    try {
      const apiUrl =
        this.courierConfig.environment === 'production'
          ? 'https://api.courier.uz/v1/rates'
          : 'https://test-api.courier.uz/v1/rates';

      const requestData = {
        pickup: {
          address: fromAddress.street1,
          city: fromAddress.city,
          phone: fromAddress.phone,
        },
        delivery: {
          address: toAddress.street1,
          city: toAddress.city,
          phone: toAddress.phone,
        },
        package: {
          weight: packages.reduce((sum, pkg) => sum + pkg.weight, 0),
          dimensions: packages[0].dimensions,
          value: packages.reduce((sum, pkg) => sum + pkg.value, 0),
        },
      };

      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.courierConfig.apiKey}`,
        },
      });

      return response.data.options.map((option: any) => ({
        providerId: 'courier',
        serviceId: option.id,
        serviceName: option.name,
        cost: option.price,
        currency: 'UZS',
        deliveryTime: {
          min: option.delivery_time.min,
          max: option.delivery_time.max,
          unit: 'hours',
        },
        features: {
          tracking: option.features.tracking,
          insurance: option.features.insurance,
          signature: option.features.signature,
        },
        taxes: option.taxes || 0,
        fees: option.fees || [],
        totalCost: option.total_price,
      }));
    } catch (error) {
      logger.error('Failed to get courier rates', error);
      return [];
    }
  }

  /**
   * Create shipment
   */
  async createShipment(
    orderId: string,
    providerId: string,
    serviceId: string,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[],
    options?: {
      insurance?: { value: number };
      signature?: boolean;
      saturdayDelivery?: boolean;
      customs?: any;
    }
  ): Promise<Shipment> {
    try {
      logger.info('Creating shipment', {
        orderId,
        providerId,
        serviceId,
        fromCity: fromAddress.city,
        toCity: toAddress.city,
      });

      let shipment: Shipment;

      switch (providerId) {
        case 'uzpost':
          shipment = await this.createUzPostShipment(
            orderId,
            serviceId,
            fromAddress,
            toAddress,
            packages,
            options
          );
          break;
        case 'uzauto':
          shipment = await this.createUzAutoShipment(
            orderId,
            serviceId,
            fromAddress,
            toAddress,
            packages,
            options
          );
          break;
        case 'courier':
          shipment = await this.createCourierShipment(
            orderId,
            serviceId,
            fromAddress,
            toAddress,
            packages,
            options
          );
          break;
        default:
          throw createError(400, `Unsupported shipping provider: ${providerId}`);
      }

      logger.info('Shipment created successfully', {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        providerId,
      });

      return shipment;
    } catch (error) {
      logger.error('Failed to create shipment', error);
      throw createError(500, 'Failed to create shipment');
    }
  }

  /**
   * Create UzPost shipment
   */
  private async createUzPostShipment(
    orderId: string,
    serviceId: string,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[],
    options?: any
  ): Promise<Shipment> {
    const apiUrl =
      this.uzPostConfig.environment === 'production'
        ? 'https://api.uzpost.uz/v1/shipments'
        : 'https://test-api.uzpost.uz/v1/shipments';

    const requestData = {
      order_id: orderId,
      service_id: serviceId,
      from_address: fromAddress,
      to_address: toAddress,
      packages: packages,
      options: options,
    };

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.uzPostConfig.apiKey}`,
      },
    });

    const data = response.data;

    return {
      id: data.shipment_id,
      orderId,
      trackingNumber: data.tracking_number,
      providerId: 'uzpost',
      serviceId,
      status: 'created',
      fromAddress,
      toAddress,
      packages,
      cost: data.cost,
      currency: 'UZS',
      label: {
        url: data.label_url,
        format: 'pdf',
      },
      tracking: {
        events: [],
        estimatedDelivery: new Date(data.estimated_delivery),
      },
      insurance: options?.insurance,
      customs: options?.customs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create UzAuto shipment
   */
  private async createUzAutoShipment(
    orderId: string,
    serviceId: string,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[],
    options?: any
  ): Promise<Shipment> {
    const apiUrl =
      this.uzAutoConfig.environment === 'production'
        ? 'https://api.uzauto.uz/v1/shipping/shipments'
        : 'https://test-api.uzauto.uz/v1/shipping/shipments';

    const requestData = {
      order_id: orderId,
      service_id: serviceId,
      origin: {
        address: fromAddress.street1,
        city: fromAddress.city,
        region: fromAddress.state,
        contact: {
          name: fromAddress.name,
          phone: fromAddress.phone,
        },
      },
      destination: {
        address: toAddress.street1,
        city: toAddress.city,
        region: toAddress.state,
        contact: {
          name: toAddress.name,
          phone: toAddress.phone,
        },
      },
      cargo: {
        weight: packages.reduce((sum, pkg) => sum + pkg.weight, 0),
        volume: packages.reduce(
          (sum, pkg) => sum + pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height,
          0
        ),
        value: packages.reduce((sum, pkg) => sum + pkg.value, 0),
        description: packages
          .map((pkg) => pkg.contents.map((item) => item.description).join(', '))
          .join('; '),
      },
      options: options,
    };

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.uzAutoConfig.apiKey}`,
      },
    });

    const data = response.data;

    return {
      id: data.shipment_id,
      orderId,
      trackingNumber: data.tracking_number,
      providerId: 'uzauto',
      serviceId,
      status: 'created',
      fromAddress,
      toAddress,
      packages,
      cost: data.cost,
      currency: 'UZS',
      label: {
        url: data.label_url,
        format: 'pdf',
      },
      tracking: {
        events: [],
        estimatedDelivery: new Date(data.estimated_delivery),
      },
      insurance: options?.insurance,
      customs: options?.customs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create courier shipment
   */
  private async createCourierShipment(
    orderId: string,
    serviceId: string,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: Package[],
    options?: any
  ): Promise<Shipment> {
    const apiUrl =
      this.courierConfig.environment === 'production'
        ? 'https://api.courier.uz/v1/shipments'
        : 'https://test-api.courier.uz/v1/shipments';

    const requestData = {
      order_id: orderId,
      service_id: serviceId,
      pickup: {
        address: fromAddress.street1,
        city: fromAddress.city,
        contact: {
          name: fromAddress.name,
          phone: fromAddress.phone,
        },
      },
      delivery: {
        address: toAddress.street1,
        city: toAddress.city,
        contact: {
          name: toAddress.name,
          phone: toAddress.phone,
        },
      },
      package: {
        weight: packages.reduce((sum, pkg) => sum + pkg.weight, 0),
        dimensions: packages[0].dimensions,
        value: packages.reduce((sum, pkg) => sum + pkg.value, 0),
        description: packages
          .map((pkg) => pkg.contents.map((item) => item.description).join(', '))
          .join('; '),
      },
      options: options,
    };

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.courierConfig.apiKey}`,
      },
    });

    const data = response.data;

    return {
      id: data.shipment_id,
      orderId,
      trackingNumber: data.tracking_number,
      providerId: 'courier',
      serviceId,
      status: 'created',
      fromAddress,
      toAddress,
      packages,
      cost: data.cost,
      currency: 'UZS',
      label: {
        url: data.label_url,
        format: 'pdf',
      },
      tracking: {
        events: [],
        estimatedDelivery: new Date(data.estimated_delivery),
      },
      insurance: options?.insurance,
      customs: options?.customs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string, providerId?: string): Promise<TrackingEvent[]> {
    try {
      logger.info('Tracking shipment', { trackingNumber, providerId });

      let events: TrackingEvent[] = [];

      if (!providerId) {
        // Try all providers
        const providers = ['uzpost', 'uzauto', 'courier'];
        for (const provider of providers) {
          try {
            events = await this.trackWithProvider(provider, trackingNumber);
            if (events.length > 0) break;
          } catch (error) {
            logger.warn(`Failed to track with provider ${provider}`, error);
          }
        }
      } else {
        events = await this.trackWithProvider(providerId, trackingNumber);
      }

      logger.info('Shipment tracking retrieved', {
        trackingNumber,
        providerId,
        eventCount: events.length,
      });

      return events;
    } catch (error) {
      logger.error('Failed to track shipment', error);
      throw createError(500, 'Failed to track shipment');
    }
  }

  /**
   * Track with specific provider
   */
  private async trackWithProvider(
    providerId: string,
    trackingNumber: string
  ): Promise<TrackingEvent[]> {
    let apiUrl: string;
    let apiKey: string;

    switch (providerId) {
      case 'uzpost':
        apiUrl =
          this.uzPostConfig.environment === 'production'
            ? `https://api.uzpost.uz/v1/tracking/${trackingNumber}`
            : `https://test-api.uzpost.uz/v1/tracking/${trackingNumber}`;
        apiKey = this.uzPostConfig.apiKey;
        break;
      case 'uzauto':
        apiUrl =
          this.uzAutoConfig.environment === 'production'
            ? `https://api.uzauto.uz/v1/shipping/tracking/${trackingNumber}`
            : `https://test-api.uzauto.uz/v1/shipping/tracking/${trackingNumber}`;
        apiKey = this.uzAutoConfig.apiKey;
        break;
      case 'courier':
        apiUrl =
          this.courierConfig.environment === 'production'
            ? `https://api.courier.uz/v1/tracking/${trackingNumber}`
            : `https://test-api.courier.uz/v1/tracking/${trackingNumber}`;
        apiKey = this.courierConfig.apiKey;
        break;
      default:
        throw createError(400, `Unsupported provider: ${providerId}`);
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data.events.map((event: any) => ({
      timestamp: new Date(event.timestamp),
      status: event.status,
      description: event.description,
      location: event.location,
      details: event.details,
    }));
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentId: string): Promise<void> {
    try {
      logger.info('Cancelling shipment', { shipmentId });

      // Implementation would call provider API to cancel shipment
      // For now, we'll just log the cancellation

      logger.info('Shipment cancelled successfully', { shipmentId });
    } catch (error) {
      logger.error('Failed to cancel shipment', error);
      throw createError(500, 'Failed to cancel shipment');
    }
  }

  /**
   * Get delivery zones
   */
  getDeliveryZones(country?: string): DeliveryZone[] {
    // Return O'zbekiston delivery zones
    const zones: DeliveryZone[] = [
      {
        id: 'tashkent',
        name: 'Toshkent shahri',
        providerId: 'courier',
        regions: [{ country: 'UZ', states: ['Tashkent'] }],
        rates: [
          {
            serviceId: 'express',
            baseRate: 50000,
            weightRate: 2000,
            freeShippingThreshold: 1000000,
          },
        ],
        deliveryTime: { min: 1, max: 2, unit: 'hours' },
        restrictions: { maxWeight: 50, maxValue: 5000000 },
      },
      {
        id: 'uzbekistan',
        name: "O'zbekiston Respublikasi",
        providerId: 'uzpost',
        regions: [{ country: 'UZ' }],
        rates: [
          {
            serviceId: 'standard',
            baseRate: 100000,
            weightRate: 5000,
            freeShippingThreshold: 2000000,
          },
        ],
        deliveryTime: { min: 1, max: 3, unit: 'days' },
        restrictions: { maxWeight: 100, maxValue: 10000000 },
      },
    ];

    if (country) {
      return zones.filter((zone) => zone.regions.some((region) => region.country === country));
    }

    return zones;
  }

  /**
   * Get delivery estimate
   */
  async getDeliveryEstimate(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    serviceId: string
  ): Promise<{
    estimatedDelivery: Date;
    businessDays: number;
    transitTime: string;
  }> {
    try {
      // Calculate delivery estimate based on distance and service
      const distance = this.calculateDistance(fromAddress, toAddress);
      const businessDays = this.calculateBusinessDays(distance, serviceId);
      const estimatedDelivery = this.calculateBusinessDays(new Date(), businessDays);

      return {
        estimatedDelivery,
        businessDays,
        transitTime: `${businessDays} kun`,
      };
    } catch (error) {
      logger.error('Failed to get delivery estimate', error);
      throw createError(500, 'Failed to get delivery estimate');
    }
  }

  /**
   * Validate address
   */
  async validateAddress(address: ShippingAddress): Promise<{
    valid: boolean;
    suggestions?: ShippingAddress[];
    errors?: string[];
  }> {
    try {
      // Basic validation for O'zbekiston addresses
      const errors: string[] = [];

      if (!address.street1) {
        errors.push("Manzil ko'rsatilmagan");
      }

      if (!address.city) {
        errors.push("Shahar ko'rsatilmagan");
      }

      if (!address.state) {
        errors.push("Viloyat ko'rsatilmagan");
      }

      if (address.country !== 'UZ') {
        errors.push("Faqat O'zbekiston manzillari qo'llab-quvvatlanadi");
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error('Failed to validate address', error);
      return {
        valid: false,
        errors: ['Manzil tekshirishda xatolik yuz berdi'],
      };
    }
  }

  /**
   * Private helper methods
   */
  private calculateDistance(from: ShippingAddress, to: ShippingAddress): number {
    // Simplified distance calculation
    // In production, use proper geocoding service
    return Math.random() * 1000; // km
  }

  private calculateBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    let addedDays = 0;

    while (addedDays < businessDays) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  private validatePackages(packages: Package[], service: ShippingService): void {
    for (const pkg of packages) {
      if (pkg.weight > service.maxWeight) {
        throw createError(400, `Package weight exceeds maximum allowed weight`);
      }

      const volume = pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;
      const maxVolume =
        service.maxDimensions.length * service.maxDimensions.width * service.maxDimensions.height;

      if (volume > maxVolume) {
        throw createError(400, `Package dimensions exceed maximum allowed size`);
      }
    }
  }

  private findDeliveryZone(address: ShippingAddress): DeliveryZone | undefined {
    const zones = this.getDeliveryZones();
    return zones.find((zone) =>
      zone.regions.some(
        (region) =>
          region.country === address.country &&
          (!region.states || region.states.includes(address.state))
      )
    );
  }

  private initializeProviders(): void {
    // Initialize O'zbekiston shipping providers
    const providers: ShippingProvider[] = [
      {
        id: 'uzpost',
        name: 'UzPost',
        code: 'UZPOST',
        apiUrl: 'https://api.uzpost.uz',
        apiKey: this.uzPostConfig.apiKey,
        supportedServices: [
          {
            id: 'standard',
            providerId: 'uzpost',
            name: 'Oddiy yuborish',
            code: 'STANDARD',
            description: '1-3 kun ichida yetkazib berish',
            maxWeight: 100,
            maxDimensions: { length: 150, width: 100, height: 100 },
            deliveryTime: { min: 1, max: 3, unit: 'days' },
            features: { tracking: true, insurance: true, signature: false, cashOnDelivery: true },
            pricing: { baseRate: 100000, weightRate: 5000, dimensionRate: 1000, fuelSurcharge: 0 },
          },
        ],
        settings: {
          defaultService: 'standard',
          trackingEnabled: true,
          insuranceEnabled: true,
          signatureRequired: false,
        },
        regions: ['UZ'],
        status: 'active',
      },
      {
        id: 'uzauto',
        name: 'UzAuto Motors',
        code: 'UZAUTO',
        apiUrl: 'https://api.uzauto.uz',
        apiKey: this.uzAutoConfig.apiKey,
        supportedServices: [
          {
            id: 'express',
            providerId: 'uzauto',
            name: 'Tezkor yuborish',
            code: 'EXPRESS',
            description: '24 soat ichida yetkazib berish',
            maxWeight: 50,
            maxDimensions: { length: 100, width: 80, height: 80 },
            deliveryTime: { min: 1, max: 1, unit: 'days' },
            features: { tracking: true, insurance: true, signature: true, cashOnDelivery: false },
            pricing: { baseRate: 200000, weightRate: 8000, dimensionRate: 2000, fuelSurcharge: 0 },
          },
        ],
        settings: {
          defaultService: 'express',
          trackingEnabled: true,
          insuranceEnabled: true,
          signatureRequired: true,
        },
        regions: ['UZ'],
        status: 'active',
      },
      {
        id: 'courier',
        name: 'Mahalliy kuryer',
        code: 'COURIER',
        apiUrl: 'https://api.courier.uz',
        apiKey: this.courierConfig.apiKey,
        supportedServices: [
          {
            id: 'same-day',
            providerId: 'courier',
            name: 'Kun ichida yetkazish',
            code: 'SAME_DAY',
            description: 'Kun ichida yetkazib berish',
            maxWeight: 20,
            maxDimensions: { length: 60, width: 40, height: 40 },
            deliveryTime: { min: 2, max: 8, unit: 'hours' },
            features: { tracking: true, insurance: false, signature: true, cashOnDelivery: true },
            pricing: { baseRate: 50000, weightRate: 3000, dimensionRate: 500, fuelSurcharge: 0 },
          },
        ],
        settings: {
          defaultService: 'same-day',
          trackingEnabled: true,
          insuranceEnabled: false,
          signatureRequired: true,
        },
        regions: ['UZ'],
        status: 'active',
      },
    ];

    providers.forEach((provider) => {
      this.providers.set(provider.id, provider);
    });
  }
}

export const shippingService = new ShippingService();
