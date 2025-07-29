/**
 * UltraMarket E-Commerce Platform
 * Toast Utility - TypeScript
 * Professional Notification System
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Toast options interface
interface ToastOptions extends ExternalToast {
  /** Toast duration in milliseconds */
  duration?: number;
  /** Position of the toast */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  /** Whether the toast can be dismissed */
  dismissible?: boolean;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Cancel button configuration */
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  /** Custom icon */
  icon?: React.ReactNode;
  /** Rich content */
  description?: string;
  /** Unique toast ID */
  id?: string | number;
}

// Default toast configuration
const DEFAULT_TOAST_OPTIONS: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  dismissible: true,
};

// Uzbek/Russian translations for common messages
const TRANSLATIONS = {
  success: {
    uz: 'Muvaffaqiyatli!',
    ru: 'Успешно!',
    en: 'Success!'
  },
  error: {
    uz: 'Xatolik!',
    ru: 'Ошибка!',
    en: 'Error!'
  },
  warning: {
    uz: 'Ogohlantirish!',
    ru: 'Предупреждение!',
    en: 'Warning!'
  },
  info: {
    uz: 'Ma\'lumot',
    ru: 'Информация',
    en: 'Info'
  },
  loading: {
    uz: 'Yuklanmoqda...',
    ru: 'Загрузка...',
    en: 'Loading...'
  }
};

// E-commerce specific messages
export const ECOMMERCE_MESSAGES = {
  cart: {
    added: {
      uz: 'Mahsulot savatga qo\'shildi',
      ru: 'Товар добавлен в корзину',
      en: 'Product added to cart'
    },
    removed: {
      uz: 'Mahsulot savatdan olib tashlandi',
      ru: 'Товар удален из корзины',
      en: 'Product removed from cart'
    },
    updated: {
      uz: 'Savatcha yangilandi',
      ru: 'Корзина обновлена',
      en: 'Cart updated'
    },
    cleared: {
      uz: 'Savatcha tozalandi',
      ru: 'Корзина очищена',
      en: 'Cart cleared'
    }
  },
  wishlist: {
    added: {
      uz: 'Sevimlilar ro\'yxatiga qo\'shildi',
      ru: 'Добавлено в избранное',
      en: 'Added to wishlist'
    },
    removed: {
      uz: 'Sevimlilardan olib tashlandi',
      ru: 'Удалено из избранного',
      en: 'Removed from wishlist'
    }
  },
  order: {
    placed: {
      uz: 'Buyurtma muvaffaqiyatli berildi',
      ru: 'Заказ успешно оформлен',
      en: 'Order placed successfully'
    },
    cancelled: {
      uz: 'Buyurtma bekor qilindi',
      ru: 'Заказ отменен',
      en: 'Order cancelled'
    },
    updated: {
      uz: 'Buyurtma yangilandi',
      ru: 'Заказ обновлен',
      en: 'Order updated'
    }
  },
  auth: {
    loginSuccess: {
      uz: 'Muvaffaqiyatli kirdingiz',
      ru: 'Вы успешно вошли',
      en: 'Successfully logged in'
    },
    loginError: {
      uz: 'Kirish xatoligi',
      ru: 'Ошибка входа',
      en: 'Login error'
    },
    logoutSuccess: {
      uz: 'Muvaffaqiyatli chiqtingiz',
      ru: 'Вы успешно вышли',
      en: 'Successfully logged out'
    },
    registerSuccess: {
      uz: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz',
      ru: 'Вы успешно зарегистрировались',
      en: 'Successfully registered'
    }
  },
  payment: {
    success: {
      uz: 'To\'lov muvaffaqiyatli amalga oshirildi',
      ru: 'Платеж успешно выполнен',
      en: 'Payment successful'
    },
    failed: {
      uz: 'To\'lov amalga oshmadi',
      ru: 'Платеж не выполнен',
      en: 'Payment failed'
    },
    processing: {
      uz: 'To\'lov qayta ishlanmoqda...',
      ru: 'Обработка платежа...',
      en: 'Processing payment...'
    }
  },
  profile: {
    updated: {
      uz: 'Profil yangilandi',
      ru: 'Профиль обновлен',
      en: 'Profile updated'
    },
    passwordChanged: {
      uz: 'Parol o\'zgartirildi',
      ru: 'Пароль изменен',
      en: 'Password changed'
    }
  }
};

// Get current language from localStorage or default to 'uz'
const getCurrentLanguage = (): 'uz' | 'ru' | 'en' => {
  const stored = localStorage.getItem('ultramarket_language');
  return (stored as 'uz' | 'ru' | 'en') || 'uz';
};

// Get translated message
const getTranslation = (messageKey: keyof typeof TRANSLATIONS): string => {
  const lang = getCurrentLanguage();
  return TRANSLATIONS[messageKey][lang];
};

// Core toast functions
class ToastManager {
  private defaultOptions: ToastOptions;

  constructor(options: ToastOptions = {}) {
    this.defaultOptions = { ...DEFAULT_TOAST_OPTIONS, ...options };
  }

  /**
   * Show success toast
   */
  success(message: string, options: ToastOptions = {}) {
    return sonnerToast.success(message, {
      ...this.defaultOptions,
      ...options,
      icon: options.icon || '✅',
    });
  }

  /**
   * Show error toast
   */
  error(message: string, options: ToastOptions = {}) {
    return sonnerToast.error(message, {
      ...this.defaultOptions,
      duration: 6000, // Longer duration for errors
      ...options,
      icon: options.icon || '❌',
    });
  }

  /**
   * Show warning toast
   */
  warning(message: string, options: ToastOptions = {}) {
    return sonnerToast.warning(message, {
      ...this.defaultOptions,
      ...options,
      icon: options.icon || '⚠️',
    });
  }

  /**
   * Show info toast
   */
  info(message: string, options: ToastOptions = {}) {
    return sonnerToast.info(message, {
      ...this.defaultOptions,
      ...options,
      icon: options.icon || 'ℹ️',
    });
  }

  /**
   * Show loading toast
   */
  loading(message: string, options: ToastOptions = {}) {
    return sonnerToast.loading(message, {
      ...this.defaultOptions,
      duration: Infinity, // Loading toasts don't auto-dismiss
      dismissible: false,
      ...options,
    });
  }

  /**
   * Show custom toast
   */
  custom(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
    const toastFunction = sonnerToast[type] || sonnerToast.info;
    return toastFunction(message, {
      ...this.defaultOptions,
      ...options,
    });
  }

  /**
   * Show promise-based toast (for async operations)
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options: ToastOptions = {}
  ) {
    return sonnerToast.promise(promise, messages, {
      ...this.defaultOptions,
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(toastId?: string | number) {
    return sonnerToast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    return sonnerToast.dismiss();
  }

  /**
   * Update toast configuration
   */
  configure(options: ToastOptions) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// Create singleton instance
export const toast = new ToastManager();

// E-commerce specific toast functions
export const ecommerceToast = {
  // Cart operations
  cartAdded: (productName?: string) => {
    const lang = getCurrentLanguage();
    const message = productName 
      ? `${productName} ${ECOMMERCE_MESSAGES.cart.added[lang]}`
      : ECOMMERCE_MESSAGES.cart.added[lang];
    
    return toast.success(message, {
      icon: '🛒',
      action: {
        label: lang === 'uz' ? 'Savatni ko\'rish' : lang === 'ru' ? 'Посмотреть корзину' : 'View Cart',
        onClick: () => window.location.href = '/cart'
      }
    });
  },

  cartRemoved: (productName?: string) => {
    const lang = getCurrentLanguage();
    const message = productName 
      ? `${productName} ${ECOMMERCE_MESSAGES.cart.removed[lang]}`
      : ECOMMERCE_MESSAGES.cart.removed[lang];
    
    return toast.info(message, { icon: '🗑️' });
  },

  // Wishlist operations
  wishlistAdded: (productName?: string) => {
    const lang = getCurrentLanguage();
    const message = productName 
      ? `${productName} ${ECOMMERCE_MESSAGES.wishlist.added[lang]}`
      : ECOMMERCE_MESSAGES.wishlist.added[lang];
    
    return toast.success(message, { icon: '❤️' });
  },

  wishlistRemoved: (productName?: string) => {
    const lang = getCurrentLanguage();
    const message = productName 
      ? `${productName} ${ECOMMERCE_MESSAGES.wishlist.removed[lang]}`
      : ECOMMERCE_MESSAGES.wishlist.removed[lang];
    
    return toast.info(message, { icon: '💔' });
  },

  // Order operations
  orderPlaced: (orderNumber?: string) => {
    const lang = getCurrentLanguage();
    const message = orderNumber 
      ? `${ECOMMERCE_MESSAGES.order.placed[lang]} #${orderNumber}`
      : ECOMMERCE_MESSAGES.order.placed[lang];
    
    return toast.success(message, {
      icon: '📦',
      duration: 6000,
      action: {
        label: lang === 'uz' ? 'Buyurtmalarni ko\'rish' : lang === 'ru' ? 'Посмотреть заказы' : 'View Orders',
        onClick: () => window.location.href = '/orders'
      }
    });
  },

  // Payment operations
  paymentProcessing: () => {
    const lang = getCurrentLanguage();
    return toast.loading(ECOMMERCE_MESSAGES.payment.processing[lang], {
      icon: '💳'
    });
  },

  paymentSuccess: () => {
    const lang = getCurrentLanguage();
    return toast.success(ECOMMERCE_MESSAGES.payment.success[lang], {
      icon: '✅',
      duration: 6000
    });
  },

  paymentFailed: (reason?: string) => {
    const lang = getCurrentLanguage();
    const message = reason 
      ? `${ECOMMERCE_MESSAGES.payment.failed[lang]}: ${reason}`
      : ECOMMERCE_MESSAGES.payment.failed[lang];
    
    return toast.error(message, {
      icon: '❌',
      duration: 8000
    });
  },

  // Auth operations
  loginSuccess: (userName?: string) => {
    const lang = getCurrentLanguage();
    const welcome = lang === 'uz' ? 'Xush kelibsiz' : lang === 'ru' ? 'Добро пожаловать' : 'Welcome';
    const message = userName 
      ? `${welcome}, ${userName}!`
      : ECOMMERCE_MESSAGES.auth.loginSuccess[lang];
    
    return toast.success(message, { icon: '👋' });
  },

  loginError: (error?: string) => {
    const lang = getCurrentLanguage();
    const message = error || ECOMMERCE_MESSAGES.auth.loginError[lang];
    return toast.error(message, { icon: '🔒' });
  },

  logoutSuccess: () => {
    const lang = getCurrentLanguage();
    return toast.success(ECOMMERCE_MESSAGES.auth.logoutSuccess[lang], { icon: '👋' });
  }
};

// Export default toast manager
export default toast;
