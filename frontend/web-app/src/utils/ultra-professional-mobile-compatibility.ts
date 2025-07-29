/**
 * 🚀 ULTRA PROFESSIONAL MOBILE COMPATIBILITY SYSTEM
 * UltraMarket E-commerce Platform
 * 
 * Advanced mobile compatibility and responsive design utilities featuring:
 * - Touch optimization and gesture handling
 * - Device detection and viewport management
 * - Performance optimization for mobile devices
 * - Accessibility enhancements for mobile users
 * - Responsive image and content delivery
 * - Mobile-specific UI adaptations
 * - Progressive Web App features
 * - Mobile analytics and performance tracking
 * 
 * @author UltraMarket Mobile Team
 * @version 4.0.0
 * @date 2024-12-28
 */

import { logger } from '../logging/ultra-professional-logger';

// =================== INTERFACES ===================

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  touchSupport: boolean;
  connectionType: string;
  batteryLevel?: number;
  memoryInfo?: {
    total: number;
    used: number;
    limit: number;
  };
}

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'rotate' | 'longpress';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  duration: number;
  distance: number;
  velocity: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: number;
  rotation?: number;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  cols: number;
  gutters: number;
  margins: number;
}

export interface MobilePerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  memoryUsage: number;
  bundleSize: number;
  imageOptimization: number;
  touchResponseTime: number;
}

export interface MobileOptimizationConfig {
  enableTouchOptimization: boolean;
  enableGestureDetection: boolean;
  enableImageLazyLoading: boolean;
  enableServiceWorker: boolean;
  enableOfflineMode: boolean;
  touchTargetMinSize: number;
  swipeThreshold: number;
  longPressDelay: number;
  performanceMonitoring: boolean;
  adaptiveLoading: boolean;
}

// =================== MOBILE COMPATIBILITY MANAGER ===================

/**
 * Ultra Professional Mobile Compatibility Manager
 */
export class UltraProfessionalMobileCompatibility {
  private deviceInfo: DeviceInfo;
  private breakpoints: ResponsiveBreakpoint[];
  private gestureListeners: Map<string, (gesture: TouchGesture) => void> = new Map();
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;
  private orientationListeners: Set<() => void> = new Set();
  private resizeListeners: Set<() => void> = new Set();
  private config: MobileOptimizationConfig;

  constructor(config?: Partial<MobileOptimizationConfig>) {
    this.config = {
      enableTouchOptimization: true,
      enableGestureDetection: true,
      enableImageLazyLoading: true,
      enableServiceWorker: true,
      enableOfflineMode: true,
      touchTargetMinSize: 44, // iOS and Android recommendation
      swipeThreshold: 50,
      longPressDelay: 500,
      performanceMonitoring: true,
      adaptiveLoading: true,
      ...config
    };

    this.deviceInfo = this.detectDevice();
    this.breakpoints = this.initializeBreakpoints();

    this.initialize();
    
    logger.info('🚀 Ultra Professional Mobile Compatibility initialized', {
      device: this.deviceInfo,
      config: this.config
    });
  }

  /**
   * Initialize mobile compatibility features
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Setup viewport
    this.setupViewport();

    // Initialize touch optimization
    if (this.config.enableTouchOptimization) {
      this.initializeTouchOptimization();
    }

    // Initialize gesture detection
    if (this.config.enableGestureDetection) {
      this.initializeGestureDetection();
    }

    // Initialize lazy loading
    if (this.config.enableImageLazyLoading) {
      this.initializeLazyLoading();
    }

    // Initialize performance monitoring
    if (this.config.performanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    // Setup orientation and resize listeners
    this.setupEventListeners();

    // Initialize PWA features
    if (this.config.enableServiceWorker) {
      this.initializeServiceWorker();
    }

    // Apply mobile-specific optimizations
    this.applyMobileOptimizations();
  }

  /**
   * Detect device information
   */
  private detectDevice(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isIOS: false,
        isAndroid: false,
        screenWidth: 1920,
        screenHeight: 1080,
        orientation: 'landscape',
        pixelRatio: 1,
        touchSupport: false,
        connectionType: 'unknown'
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/.test(userAgent);

    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      isIOS,
      isAndroid,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      batteryLevel: (navigator as any).getBattery ? undefined : undefined,
      memoryInfo: (performance as any).memory ? {
        total: (performance as any).memory.totalJSHeapSize,
        used: (performance as any).memory.usedJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : undefined
    };
  }

  /**
   * Initialize responsive breakpoints
   */
  private initializeBreakpoints(): ResponsiveBreakpoint[] {
    return [
      { name: 'xs', minWidth: 0, maxWidth: 575, cols: 1, gutters: 16, margins: 16 },
      { name: 'sm', minWidth: 576, maxWidth: 767, cols: 2, gutters: 16, margins: 20 },
      { name: 'md', minWidth: 768, maxWidth: 991, cols: 3, gutters: 20, margins: 24 },
      { name: 'lg', minWidth: 992, maxWidth: 1199, cols: 4, gutters: 24, margins: 32 },
      { name: 'xl', minWidth: 1200, maxWidth: 1599, cols: 6, gutters: 32, margins: 40 },
      { name: 'xxl', minWidth: 1600, cols: 8, gutters: 40, margins: 48 }
    ];
  }

  /**
   * Setup optimal viewport configuration
   */
  private setupViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // Optimized viewport for UltraMarket
    const viewportContent = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=5.0', // Allow zoom for accessibility
      'minimum-scale=1.0',
      'user-scalable=yes',
      'viewport-fit=cover' // For iOS notch support
    ].join(', ');

    viewport.content = viewportContent;

    // Add theme color for mobile browsers
    this.setThemeColor('#007bff');

    // Add mobile web app capabilities
    this.setupMobileWebAppMeta();
  }

  /**
   * Setup mobile web app meta tags
   */
  private setupMobileWebAppMeta(): void {
    const metas = [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'UltraMarket' },
      { name: 'application-name', content: 'UltraMarket' },
      { name: 'msapplication-TileColor', content: '#007bff' },
      { name: 'msapplication-tap-highlight', content: 'no' }
    ];

    metas.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
  }

  /**
   * Set theme color for mobile browsers
   */
  private setThemeColor(color: string): void {
    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = color;
  }

  /**
   * Initialize touch optimization
   */
  private initializeTouchOptimization(): void {
    // Add touch-specific CSS classes
    document.documentElement.classList.add('touch-optimized');
    
    if (this.deviceInfo.isMobile) {
      document.documentElement.classList.add('mobile-device');
    }

    if (this.deviceInfo.isTablet) {
      document.documentElement.classList.add('tablet-device');
    }

    // Optimize touch targets
    this.optimizeTouchTargets();

    // Disable 300ms click delay on mobile
    this.disableClickDelay();

    // Add haptic feedback where available
    this.enableHapticFeedback();
  }

  /**
   * Optimize touch targets for better mobile experience
   */
  private optimizeTouchTargets(): void {
    const minSize = this.config.touchTargetMinSize;
    
    // Add CSS for minimum touch target sizes
    const style = document.createElement('style');
    style.textContent = `
      .touch-target,
      button,
      a,
      input,
      select,
      textarea,
      [role="button"],
      [onclick] {
        min-height: ${minSize}px;
        min-width: ${minSize}px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .touch-target::before,
      button::before,
      a::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-height: ${minSize}px;
        min-width: ${minSize}px;
        z-index: -1;
      }

      @media (hover: none) and (pointer: coarse) {
        .hover-effect:hover {
          background-color: rgba(0, 123, 255, 0.1);
          transition: background-color 0.15s ease;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Disable 300ms click delay on mobile
   */
  private disableClickDelay(): void {
    const style = document.createElement('style');
    style.textContent = `
      html {
        touch-action: manipulation;
      }
      
      * {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enable haptic feedback where available
   */
  private enableHapticFeedback(): void {
    if ('vibrate' in navigator) {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.matches('button, .btn, [role="button"]')) {
          navigator.vibrate(10); // Short vibration for button presses
        }
      });
    }
  }

  /**
   * Initialize gesture detection
   */
  private initializeGestureDetection(): void {
    let touchStart: { x: number; y: number; time: number } | null = null;
    let touchEnd: { x: number; y: number; time: number } | null = null;

    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      touchEnd = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      this.processGesture(touchStart, touchEnd);
      touchStart = null;
      touchEnd = null;
    }, { passive: true });
  }

  /**
   * Process detected gestures
   */
  private processGesture(start: { x: number; y: number; time: number }, end: { x: number; y: number; time: number }): void {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = end.time - start.time;
    const velocity = distance / duration;

    let gestureType: TouchGesture['type'] = 'tap';
    let direction: TouchGesture['direction'] | undefined;

    if (duration > this.config.longPressDelay) {
      gestureType = 'longpress';
    } else if (distance > this.config.swipeThreshold) {
      gestureType = 'swipe';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    const gesture: TouchGesture = {
      type: gestureType,
      startPoint: { x: start.x, y: start.y },
      endPoint: { x: end.x, y: end.y },
      duration,
      distance,
      velocity,
      direction
    };

    this.notifyGestureListeners(gesture);
  }

  /**
   * Notify gesture listeners
   */
  private notifyGestureListeners(gesture: TouchGesture): void {
    this.gestureListeners.forEach((callback, type) => {
      if (type === 'all' || type === gesture.type) {
        try {
          callback(gesture);
        } catch (error) {
          logger.error('❌ Error in gesture listener', error);
        }
      }
    });
  }

  /**
   * Initialize lazy loading for images
   */
  private initializeLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              
              if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                img.removeAttribute('data-srcset');
              }

              img.classList.remove('lazy');
              img.classList.add('loaded');
              
              this.intersectionObserver?.unobserve(img);
            }
          });
        },
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1
        }
      );

      // Observe all lazy images
      this.observeLazyImages();
    }
  }

  /**
   * Observe lazy images
   */
  private observeLazyImages(): void {
    const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
    lazyImages.forEach((img) => {
      this.intersectionObserver?.observe(img);
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformanceMetric(entry);
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['paint', 'layout-shift', 'first-input'] });
      } catch (error) {
        logger.warn('⚠️ Performance Observer not fully supported', error);
      }
    }

    // Track mobile-specific metrics
    this.trackMobileMetrics();
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetric(entry: PerformanceEntry): void {
    logger.debug('📊 Performance metric', {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration
    });
  }

  /**
   * Track mobile-specific metrics
   */
  private trackMobileMetrics(): void {
    // Track memory usage on mobile
    if (this.deviceInfo.memoryInfo) {
      const memoryUsage = (this.deviceInfo.memoryInfo.used / this.deviceInfo.memoryInfo.total) * 100;
      
      if (memoryUsage > 80) {
        logger.warn('⚠️ High memory usage detected', { usage: memoryUsage });
        this.optimizeForLowMemory();
      }
    }

    // Track connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        logger.info('📱 Slow connection detected, applying optimizations');
        this.optimizeForSlowConnection();
      }
    }
  }

  /**
   * Optimize for low memory devices
   */
  private optimizeForLowMemory(): void {
    // Reduce image quality
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (img.srcset) {
        // Use lower resolution images
        const srcsetParts = img.srcset.split(',');
        const lowestRes = srcsetParts[0].trim();
        img.src = lowestRes.split(' ')[0];
        img.removeAttribute('srcset');
      }
    });

    // Disable some animations
    document.documentElement.classList.add('reduce-motion');
  }

  /**
   * Optimize for slow connection
   */
  private optimizeForSlowConnection(): void {
    // Preload critical resources only
    const criticalImages = document.querySelectorAll('img[data-critical]');
    criticalImages.forEach((img) => {
      if (img instanceof HTMLImageElement && img.dataset.src) {
        img.src = img.dataset.src;
      }
    });

    // Defer non-critical resources
    const nonCriticalImages = document.querySelectorAll('img:not([data-critical])');
    nonCriticalImages.forEach((img) => {
      img.setAttribute('loading', 'lazy');
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Handle visibility change for performance optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    this.deviceInfo.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    this.deviceInfo.screenWidth = window.innerWidth;
    this.deviceInfo.screenHeight = window.innerHeight;

    this.orientationListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logger.error('❌ Error in orientation listener', error);
      }
    });

    logger.debug('📱 Orientation changed', {
      orientation: this.deviceInfo.orientation,
      width: this.deviceInfo.screenWidth,
      height: this.deviceInfo.screenHeight
    });
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.deviceInfo.screenWidth = window.innerWidth;
    this.deviceInfo.screenHeight = window.innerHeight;

    this.resizeListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logger.error('❌ Error in resize listener', error);
      }
    });
  }

  /**
   * Handle page hidden (performance optimization)
   */
  private handlePageHidden(): void {
    // Pause non-essential operations
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  /**
   * Handle page visible
   */
  private handlePageVisible(): void {
    // Resume operations
    if (this.config.performanceMonitoring && this.performanceObserver) {
      try {
        this.performanceObserver.observe({ entryTypes: ['paint', 'layout-shift', 'first-input'] });
      } catch (error) {
        logger.warn('⚠️ Failed to resume performance monitoring', error);
      }
    }
  }

  /**
   * Initialize service worker for PWA features
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        logger.info('🔧 Service Worker registered successfully', { scope: registration.scope });
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update available notification
                this.showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        logger.error('❌ Service Worker registration failed', error);
      }
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    // Create update notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span>Yangi versiya mavjud</span>
        <button id="update-btn">Yangilash</button>
        <button id="dismiss-btn">Keyinroq</button>
      </div>
    `;

    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: inherit;
    `;

    document.body.appendChild(notification);

    // Handle update button
    notification.querySelector('#update-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    // Handle dismiss button
    notification.querySelector('#dismiss-btn')?.addEventListener('click', () => {
      notification.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Apply mobile-specific optimizations
   */
  private applyMobileOptimizations(): void {
    if (this.deviceInfo.isMobile) {
      // Add mobile-specific CSS
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 768px) {
          .mobile-hidden {
            display: none !important;
          }
          
          .mobile-full-width {
            width: 100% !important;
          }
          
          .mobile-stack {
            flex-direction: column !important;
          }
          
          .mobile-center {
            text-align: center !important;
          }
          
          .mobile-padding {
            padding: 16px !important;
          }
        }
        
        /* Improve scrolling performance */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Optimize for mobile interactions */
        input, textarea, select {
          font-size: 16px; /* Prevent zoom on iOS */
        }
        
        /* Better focus states for mobile */
        button:focus,
        a:focus,
        input:focus,
        textarea:focus,
        select:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // =================== PUBLIC API ===================

  /**
   * Get current device information
   */
  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Get current breakpoint
   */
  public getCurrentBreakpoint(): ResponsiveBreakpoint {
    const width = window.innerWidth;
    return this.breakpoints.find(bp => 
      width >= bp.minWidth && (bp.maxWidth === undefined || width <= bp.maxWidth)
    ) || this.breakpoints[0];
  }

  /**
   * Check if current screen matches breakpoint
   */
  public matchesBreakpoint(breakpointName: string): boolean {
    const breakpoint = this.breakpoints.find(bp => bp.name === breakpointName);
    if (!breakpoint) return false;
    
    const width = window.innerWidth;
    return width >= breakpoint.minWidth && 
           (breakpoint.maxWidth === undefined || width <= breakpoint.maxWidth);
  }

  /**
   * Add gesture listener
   */
  public addGestureListener(type: TouchGesture['type'] | 'all', callback: (gesture: TouchGesture) => void): void {
    this.gestureListeners.set(type, callback);
  }

  /**
   * Remove gesture listener
   */
  public removeGestureListener(type: TouchGesture['type'] | 'all'): void {
    this.gestureListeners.delete(type);
  }

  /**
   * Add orientation change listener
   */
  public addOrientationListener(callback: () => void): void {
    this.orientationListeners.add(callback);
  }

  /**
   * Remove orientation change listener
   */
  public removeOrientationListener(callback: () => void): void {
    this.orientationListeners.delete(callback);
  }

  /**
   * Add resize listener
   */
  public addResizeListener(callback: () => void): void {
    this.resizeListeners.add(callback);
  }

  /**
   * Remove resize listener
   */
  public removeResizeListener(callback: () => void): void {
    this.resizeListeners.delete(callback);
  }

  /**
   * Optimize image for current device
   */
  public optimizeImage(img: HTMLImageElement): void {
    const pixelRatio = this.deviceInfo.pixelRatio;
    const isHighDPI = pixelRatio > 1;
    
    if (img.dataset.src) {
      let src = img.dataset.src;
      
      // Add appropriate resolution suffix
      if (isHighDPI && !src.includes('@2x')) {
        src = src.replace(/\.(jpg|jpeg|png|webp)$/, '@2x.$1');
      }
      
      // Use WebP if supported
      if (this.supportsWebP()) {
        src = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
      }
      
      img.src = src;
    }
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): MobilePerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0, // Would need LCP observer
      cumulativeLayoutShift: 0, // Would need CLS observer
      firstInputDelay: 0, // Would need FID observer
      timeToInteractive: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      memoryUsage: this.deviceInfo.memoryInfo?.used || 0,
      bundleSize: 0, // Would need bundle analyzer
      imageOptimization: this.calculateImageOptimization(),
      touchResponseTime: this.measureTouchResponseTime()
    };
  }

  /**
   * Calculate image optimization score
   */
  private calculateImageOptimization(): number {
    const images = document.querySelectorAll('img');
    let optimizedCount = 0;
    
    images.forEach((img) => {
      if (img.loading === 'lazy' || img.classList.contains('lazy')) {
        optimizedCount++;
      }
      if (img.src.includes('.webp')) {
        optimizedCount++;
      }
    });
    
    return images.length > 0 ? (optimizedCount / images.length) * 100 : 100;
  }

  /**
   * Measure touch response time
   */
  private measureTouchResponseTime(): number {
    // This would be measured over time with actual touch events
    return 16; // Target 16ms for 60fps
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.gestureListeners.clear();
    this.orientationListeners.clear();
    this.resizeListeners.clear();
  }
}

// =================== REACT HOOKS ===================

import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for mobile compatibility
 */
export function useMobileCompatibility(config?: Partial<MobileOptimizationConfig>) {
  const [mobileCompat] = useState(() => new UltraProfessionalMobileCompatibility(config));
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(mobileCompat.getDeviceInfo());
  const [currentBreakpoint, setCurrentBreakpoint] = useState<ResponsiveBreakpoint>(
    mobileCompat.getCurrentBreakpoint()
  );

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(mobileCompat.getDeviceInfo());
      setCurrentBreakpoint(mobileCompat.getCurrentBreakpoint());
    };

    mobileCompat.addResizeListener(handleResize);
    mobileCompat.addOrientationListener(handleResize);

    return () => {
      mobileCompat.removeResizeListener(handleResize);
      mobileCompat.removeOrientationListener(handleResize);
    };
  }, [mobileCompat]);

  const addGestureListener = useCallback((
    type: TouchGesture['type'] | 'all',
    callback: (gesture: TouchGesture) => void
  ) => {
    mobileCompat.addGestureListener(type, callback);
  }, [mobileCompat]);

  const matchesBreakpoint = useCallback((breakpointName: string) => {
    return mobileCompat.matchesBreakpoint(breakpointName);
  }, [mobileCompat]);

  const getPerformanceMetrics = useCallback(() => {
    return mobileCompat.getPerformanceMetrics();
  }, [mobileCompat]);

  useEffect(() => {
    return () => {
      mobileCompat.cleanup();
    };
  }, [mobileCompat]);

  return {
    deviceInfo,
    currentBreakpoint,
    addGestureListener,
    matchesBreakpoint,
    getPerformanceMetrics,
    mobileCompat
  };
}

/**
 * React hook for responsive breakpoints
 */
export function useBreakpoint() {
  const { currentBreakpoint, matchesBreakpoint } = useMobileCompatibility();

  return {
    current: currentBreakpoint.name,
    isMobile: matchesBreakpoint('xs') || matchesBreakpoint('sm'),
    isTablet: matchesBreakpoint('md'),
    isDesktop: matchesBreakpoint('lg') || matchesBreakpoint('xl') || matchesBreakpoint('xxl'),
    matches: matchesBreakpoint
  };
}

/**
 * React hook for touch gestures
 */
export function useTouchGestures() {
  const { addGestureListener } = useMobileCompatibility();
  const [lastGesture, setLastGesture] = useState<TouchGesture | null>(null);

  useEffect(() => {
    addGestureListener('all', (gesture) => {
      setLastGesture(gesture);
    });
  }, [addGestureListener]);

  return { lastGesture };
}

// =================== GLOBAL INSTANCE ===================

// Create global instance for immediate use
export const mobileCompatibility = new UltraProfessionalMobileCompatibility();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    logger.info('🚀 Mobile compatibility system auto-initialized');
  });
}

export default UltraProfessionalMobileCompatibility; 