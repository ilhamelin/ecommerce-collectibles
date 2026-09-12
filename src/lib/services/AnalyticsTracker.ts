/**
 * AnalyticsTracker: Non-blocking client-side analytics service
 * Tracks web visits, product clicks and user interest without degrading page performance.
 */

export interface TrackedProductInfo {
  sku: string;
  name: string;
  category?: string;
  price?: number;
}

class AnalyticsTrackerService {
  private static instance: AnalyticsTrackerService;
  private queue: any[] = [];
  private flushTimer: any = null;

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flush(true);
      });
    }
  }

  public static getInstance(): AnalyticsTrackerService {
    if (!AnalyticsTrackerService.instance) {
      AnalyticsTrackerService.instance = new AnalyticsTrackerService();
    }
    return AnalyticsTrackerService.instance;
  }

  private getVisitorId(): string {
    if (typeof window === "undefined") return "server-visitor";
    let vid = localStorage.getItem("omni_visitor_id");
    if (!vid) {
      vid = "vis_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem("omni_visitor_id", vid);
    }
    return vid;
  }

  private getUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const auth = localStorage.getItem("omni_auth_session");
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed.user?.id || parsed.user?.email || null;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Track a page view event
   */
  public trackPageView(path: string, title?: string) {
    if (typeof window === "undefined") return;
    this.enqueue({
      type: "PAGE_VIEW",
      path: path || window.location.pathname,
      title: title || document.title,
      visitorId: this.getVisitorId(),
      userId: this.getUserId(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Track a product click event
   */
  public trackProductClick(product: TrackedProductInfo, source: string = "CATALOG") {
    if (typeof window === "undefined") return;
    this.enqueue({
      type: "PRODUCT_CLICK",
      productSku: product.sku,
      productName: product.name,
      category: product.category || "GENERAL",
      price: product.price || 0,
      source,
      visitorId: this.getVisitorId(),
      userId: this.getUserId(),
      timestamp: Date.now(),
    });
  }

  /**
   * Track product detail page view
   */
  public trackProductView(product: TrackedProductInfo) {
    if (typeof window === "undefined") return;
    this.enqueue({
      type: "PRODUCT_VIEW",
      productSku: product.sku,
      productName: product.name,
      category: product.category || "GENERAL",
      price: product.price || 0,
      visitorId: this.getVisitorId(),
      userId: this.getUserId(),
      timestamp: Date.now(),
    });
  }

  private enqueue(event: any) {
    this.queue.push(event);

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush(false);
      }, 3000);
    }

    if (this.queue.length >= 10) {
      this.flush(false);
    }
  }

  private flush(isUrgent: boolean = false) {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const payload = JSON.stringify({ events: eventsToSend });

    if (isUrgent && typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
        return;
      } catch (_) {}
    }

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

export const analytics = AnalyticsTrackerService.getInstance();
