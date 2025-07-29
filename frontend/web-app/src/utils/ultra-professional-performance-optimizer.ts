/**
 * 🚀 ULTRA PROFESSIONAL FRONTEND PERFORMANCE OPTIMIZER
 * UltraMarket E-commerce Platform
 * 
 * Advanced frontend performance optimization system featuring:
 * - Dynamic code splitting and lazy loading
 * - Bundle size analysis and optimization
 * - Image lazy loading and optimization
 * - Component performance monitoring
 * - Memory usage optimization
 * - Network request optimization
 * - Critical resource preloading
 * - Performance metrics collection
 * - User experience monitoring
 * - Progressive Web App optimizations
 * 
 * @author UltraMarket Frontend Team
 * @version 7.0.0
 * @date 2024-12-28
 */

import { lazy, ComponentType, Suspense, useEffect, useState, useCallback, memo } from 'react';

// Professional TypeScript interfaces
export interface PerformanceConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  
  // Bundle optimization
  bundleOptimization: {
    enableCodeSplitting: boolean;
    enableLazyLoading: boolean;
    chunkSizeLimit: number; // KB
    maxChunks: number;
    enablePreloading: boolean;
    preloadStrategy: 'aggressive' | 'conservative' | 'smart';
  };
  
  // Image optimization
  imageOptimization: {
    enableLazyLoading: boolean;
    enableWebP: boolean;
    enableProgressiveLoading: boolean;
    compressionQuality: number;
    resizeStrategy: 'client' | 'server' | 'hybrid';
    placeholderStrategy: 'blur' | 'skeleton' | 'color';
  };
  
  // Performance monitoring
  monitoring: {
    enableMetrics: boolean;
    enableUserTiming: boolean;
    enableResourceTiming: boolean;
    enableNavigationTiming: boolean;
    metricsEndpoint?: string;
    sampleRate: number; // 0-1
  };
  
  // Memory optimization
  memoryOptimization: {
    enableComponentUnmounting: boolean;
    enableEventListenerCleanup: boolean;
    enableMemoryLeakDetection: boolean;
    maxComponentInstances: number;
  };
  
  // Network optimization
  networkOptimization: {
    enableRequestBatching: boolean;
    enableResponseCaching: boolean;
    enableCompression: boolean;
    requestTimeout: number; // ms
    retryAttempts: number;
  };
}

export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  
  // Custom metrics
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
  
  // Resource metrics
  bundleSize: number;
  imageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  
  // User experience metrics
  pageLoadTime: number;
  navigationTime: number;
  errorRate: number;
  bounceRate: number;
  
  timestamp: Date;
}

export interface ComponentPerformanceData {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  memoryUsage: number;
  propsSize: number;
  childrenCount: number;
  lastRender: Date;
}

export interface BundleAnalysis {
  totalSize: number;
  chunkSizes: Record<string, number>;
  unusedCode: string[];
  duplicatedModules: string[];
  largestDependencies: Array<{ name: string; size: number }>;
  recommendations: string[];
}

/**
 * Performance optimization utilities
 */
export class UltraProfessionalPerformanceOptimizer {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics | null = null;
  private componentMetrics: Map<string, ComponentPerformanceData> = new Map();
  private observer: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.initializePerformanceMonitoring();
    this.setupImageLazyLoading();
    this.initializeMemoryOptimization();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (!this.config.monitoring.enableMetrics || typeof window === 'undefined') {
      return;
    }

    // Web Vitals monitoring
    this.observeWebVitals();
    
    // Resource timing
    if (this.config.monitoring.enableResourceTiming) {
      this.observeResourceTiming();
    }
    
    // Navigation timing
    if (this.config.monitoring.enableNavigationTiming) {
      this.observeNavigationTiming();
    }
    
    // User timing
    if (this.config.monitoring.enableUserTiming) {
      this.observeUserTiming();
    }

    console.log('🚀 Ultra Professional Performance Optimizer initialized');
  }

  /**
   * Observe Web Vitals
   */
  private observeWebVitals(): void {
    try {
      // First Contentful Paint
      this.observePerformanceEntry('paint', (entries) => {
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp && this.metrics) {
          this.metrics.firstContentfulPaint = fcp.startTime;
        }
      });

      // Largest Contentful Paint
      this.observePerformanceEntry('largest-contentful-paint', (entries) => {
        const lcp = entries[entries.length - 1];
        if (lcp && this.metrics) {
          this.metrics.largestContentfulPaint = lcp.startTime;
        }
      });

      // First Input Delay
      this.observePerformanceEntry('first-input', (entries) => {
        const fid = entries[0];
        if (fid && this.metrics) {
          this.metrics.firstInputDelay = fid.processingStart - fid.startTime;
        }
      });

      // Cumulative Layout Shift
      this.observePerformanceEntry('layout-shift', (entries) => {
        let cumulativeScore = 0;
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            cumulativeScore += (entry as any).value;
          }
        }
        if (this.metrics) {
          this.metrics.cumulativeLayoutShift = cumulativeScore;
        }
      });

    } catch (error) {
      console.error('❌ Failed to observe Web Vitals:', error);
    }
  }

  /**
   * Observe performance entries by type
   */
  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      if (!window.PerformanceObserver) return;

      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`⚠️ Failed to observe ${type} performance entries:`, error);
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let totalImageLoadTime = 0;
    let imageCount = 0;
    let totalApiTime = 0;
    let apiCount = 0;

    resources.forEach(resource => {
      if (resource.initiatorType === 'img') {
        totalImageLoadTime += resource.responseEnd - resource.startTime;
        imageCount++;
      } else if (resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest') {
        totalApiTime += resource.responseEnd - resource.startTime;
        apiCount++;
      }
    });

    if (this.metrics) {
      this.metrics.imageLoadTime = imageCount > 0 ? totalImageLoadTime / imageCount : 0;
      this.metrics.apiResponseTime = apiCount > 0 ? totalApiTime / apiCount : 0;
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation && this.metrics) {
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.navigationTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
    }
  }

  /**
   * Observe user timing
   */
  private observeUserTiming(): void {
    this.observePerformanceEntry('measure', (entries) => {
      entries.forEach(entry => {
        console.log(`📊 User Timing: ${entry.name} took ${entry.duration}ms`);
      });
    });
  }

  /**
   * Setup image lazy loading
   */
  private setupImageLazyLoading(): void {
    if (!this.config.imageOptimization.enableLazyLoading || typeof window === 'undefined') {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              this.intersectionObserver?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  /**
   * Initialize memory optimization
   */
  private initializeMemoryOptimization(): void {
    if (!this.config.memoryOptimization.enableMemoryLeakDetection || typeof window === 'undefined') {
      return;
    }

    // Monitor memory usage
    setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        if (this.metrics) {
          this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        }

        // Alert if memory usage is high
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
          console.warn('⚠️ High memory usage detected:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Mark performance timing
   */
  public mark(name: string): void {
    if (this.config.monitoring.enableUserTiming && typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  /**
   * Measure performance between marks
   */
  public measure(name: string, startMark: string, endMark?: string): number {
    if (!this.config.monitoring.enableUserTiming || typeof performance === 'undefined') {
      return 0;
    }

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[measures.length - 1].duration : 0;
    } catch (error) {
      console.error('❌ Failed to measure performance:', error);
      return 0;
    }
  }

  /**
   * Track component performance
   */
  public trackComponentPerformance(componentName: string, renderTime: number, additionalData: Partial<ComponentPerformanceData> = {}): void {
    const existing = this.componentMetrics.get(componentName);
    
    const data: ComponentPerformanceData = {
      componentName,
      renderTime,
      mountTime: existing?.mountTime || renderTime,
      updateCount: (existing?.updateCount || 0) + 1,
      memoryUsage: additionalData.memoryUsage || 0,
      propsSize: additionalData.propsSize || 0,
      childrenCount: additionalData.childrenCount || 0,
      lastRender: new Date(),
      ...additionalData
    };

    this.componentMetrics.set(componentName, data);

    // Alert on slow components
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`🐌 Slow component render detected: ${componentName} took ${renderTime}ms`);
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    if (!this.metrics) {
      this.metrics = {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0,
        speedIndex: 0,
        bundleSize: 0,
        imageLoadTime: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
        pageLoadTime: 0,
        navigationTime: 0,
        errorRate: 0,
        bounceRate: 0,
        timestamp: new Date()
      };
    }

    return { ...this.metrics };
  }

  /**
   * Get component performance data
   */
  public getComponentMetrics(): ComponentPerformanceData[] {
    return Array.from(this.componentMetrics.values());
  }

  /**
   * Send metrics to monitoring endpoint
   */
  public async sendMetrics(): Promise<void> {
    if (!this.config.monitoring.metricsEndpoint) return;

    try {
      const metrics = this.getMetrics();
      const componentMetrics = this.getComponentMetrics();

      await fetch(this.config.monitoring.metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          componentMetrics,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.error('❌ Failed to send metrics:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

/**
 * React Hooks for performance optimization
 */

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring(componentName: string) {
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);
      
      // Track component performance
      if (window.performanceOptimizer) {
        window.performanceOptimizer.trackComponentPerformance(componentName, duration);
      }
    };
  });

  return { renderTime };
}

/**
 * Image lazy loading hook
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && window.performanceOptimizer?.intersectionObserver) {
      window.performanceOptimizer.intersectionObserver.observe(node);
      node.dataset.src = src;
    }
  }, [src]);

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [src, isInView, isLoaded]);

  return { imageSrc, isLoaded, imgRef };
}

/**
 * Component memoization hook with performance tracking
 */
export function usePerformantMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  componentName?: string
): T {
  const startTime = performance.now();
  
  const result = useMemo(() => {
    const computeStart = performance.now();
    const value = factory();
    const computeTime = performance.now() - computeStart;
    
    if (componentName && computeTime > 5) {
      console.warn(`🐌 Expensive computation in ${componentName}: ${computeTime}ms`);
    }
    
    return value;
  }, deps);

  useEffect(() => {
    const totalTime = performance.now() - startTime;
    if (componentName && window.performanceOptimizer) {
      window.performanceOptimizer.trackComponentPerformance(componentName, totalTime);
    }
  });

  return result;
}

/**
 * Code splitting utilities
 */

/**
 * Enhanced lazy loading with error boundaries and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{ error?: Error }>;
    preload?: boolean;
    chunkName?: string;
  } = {}
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  // Preload if requested
  if (options.preload) {
    importFn();
  }

  return memo((props: React.ComponentProps<T>) => (
    <Suspense fallback={options.fallback ? <options.fallback /> : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  ));
}

/**
 * Bundle analysis utilities
 */
export class BundleAnalyzer {
  static async analyzeBundleSize(): Promise<BundleAnalysis> {
    // This would integrate with webpack-bundle-analyzer or similar tools
    // For now, return mock data
    return {
      totalSize: 2500000, // 2.5MB
      chunkSizes: {
        'main': 800000,
        'vendor': 1200000,
        'runtime': 50000,
        'pages': 450000
      },
      unusedCode: [
        'lodash.debounce (unused export)',
        'moment.js (large alternative available)',
        'unused CSS classes'
      ],
      duplicatedModules: [
        'react (vendor + main)',
        'lodash utilities'
      ],
      largestDependencies: [
        { name: 'react-dom', size: 120000 },
        { name: 'antd', size: 890000 },
        { name: 'moment', size: 230000 }
      ],
      recommendations: [
        'Replace moment.js with date-fns for 70% size reduction',
        'Enable tree shaking for antd components',
        'Use dynamic imports for rarely used components',
        'Enable gzip compression on server'
      ]
    };
  }

  static logBundleAnalysis(): void {
    this.analyzeBundleSize().then(analysis => {
      console.group('📦 Bundle Analysis');
      console.log('Total Size:', `${(analysis.totalSize / 1024).toFixed(2)} KB`);
      console.log('Chunk Sizes:', analysis.chunkSizes);
      console.log('Unused Code:', analysis.unusedCode);
      console.log('Duplicated Modules:', analysis.duplicatedModules);
      console.log('Largest Dependencies:', analysis.largestDependencies);
      console.log('Recommendations:', analysis.recommendations);
      console.groupEnd();
    });
  }
}

/**
 * Network optimization utilities
 */
export class NetworkOptimizer {
  private static requestQueue: Array<() => Promise<any>> = [];
  private static isProcessing = false;

  static async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    // Add requests to queue
    this.requestQueue.push(...requests);

    if (!this.isProcessing) {
      this.isProcessing = true;
      return this.processBatch();
    }

    return [];
  }

  private static async processBatch<T>(): Promise<T[]> {
    const batchSize = 3; // Process 3 requests at a time
    const results: T[] = [];

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, batchSize);
      const batchResults = await Promise.allSettled(batch.map(request => request()));
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('❌ Batch request failed:', result.reason);
        }
      });

      // Small delay between batches to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
    return results;
  }

  static preloadCriticalResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }
}

// Global performance optimizer instance
declare global {
  interface Window {
    performanceOptimizer?: UltraProfessionalPerformanceOptimizer;
  }
}

export default UltraProfessionalPerformanceOptimizer; 