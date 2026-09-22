import { describe, it, expect } from "vitest";
import { AfterShipService } from "../src/lib/services/aftershipService";
import { NextRequest } from "next/server";
import { GET as trackingGet, POST as trackingPost } from "../src/app/api/tracking/[id]/route";

describe("AfterShip Tracking Adapter & API Suite", () => {
  const service = new AfterShipService();

  describe("Courier Slug Normalization", () => {
    it("should resolve Chilean couriers to standard AfterShip slugs", () => {
      expect(service.normalizeCourierSlug("Chilexpress Prioritario")).toBe("chilexpress");
      expect(service.normalizeCourierSlug("Starken Express")).toBe("starken");
      expect(service.normalizeCourierSlug("Blue Express")).toBe("bluex");
      expect(service.normalizeCourierSlug("CorreosChile")).toBe("correos-chile");
    });

    it("should resolve International couriers for Japanese imports", () => {
      expect(service.normalizeCourierSlug("DHL Express")).toBe("dhl");
      expect(service.normalizeCourierSlug("FedEx International")).toBe("fedex");
      expect(service.normalizeCourierSlug("Japan Post EMS")).toBe("japan-post");
    });

    it("should fallback safely to starken when courier is unknown", () => {
      expect(service.normalizeCourierSlug("Courier Desconocido")).toBe("starken");
      expect(service.normalizeCourierSlug(null)).toBe("starken");
    });
  });

  describe("Status Mapping", () => {
    it("should map raw AfterShip tags to unified TrackingStatus", () => {
      expect(service.mapStatus("InfoReceived")).toBe("INFO_RECEIVED");
      expect(service.mapStatus("InTransit")).toBe("IN_TRANSIT");
      expect(service.mapStatus("OutForDelivery")).toBe("OUT_FOR_DELIVERY");
      expect(service.mapStatus("Delivered")).toBe("DELIVERED");
      expect(service.mapStatus("Exception")).toBe("EXCEPTION");
      expect(service.mapStatus("AttemptFail")).toBe("FAILED_ATTEMPT");
      expect(service.mapStatus("Unknown")).toBe("PENDING");
    });
  });

  describe("Mock & Fallback Generation", () => {
    it("should generate a valid structured TrackingResult with checkpoints", () => {
      const mockResult = service.generateMockTrackingResult("STK-982410529", "starken", "Starken Express");

      expect(mockResult.trackingNumber).toBe("STK-982410529");
      expect(mockResult.courierSlug).toBe("starken");
      expect(mockResult.source).toBe("LOCAL_FALLBACK");
      expect(mockResult.checkpoints.length).toBeGreaterThanOrEqual(3);
      expect(mockResult.checkpoints[0].status).toBe("INFO_RECEIVED");
      expect(mockResult.checkpoints[mockResult.checkpoints.length - 1].status).toBe("OUT_FOR_DELIVERY");
    });
  });

  describe("API Route /api/tracking/[id]", () => {
    it("should return tracking data on GET for a given tracking number", async () => {
      const req = new NextRequest("http://localhost:3000/api/tracking/STK-982410529", {
        method: "GET",
      });

      const res = await trackingGet(req, { params: { id: "STK-982410529" } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.trackingNumber).toBe("STK-982410529");
      expect(json.data.checkpoints).toBeInstanceOf(Array);
    });

    it("should handle POST request to register a tracking in AfterShip", async () => {
      const req = new NextRequest("http://localhost:3000/api/tracking/STK-982410529", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: "STK-982410529",
          courierSlug: "starken",
          orderId: "ORDER-1029",
        }),
      });

      const res = await trackingPost(req, { params: { id: "STK-982410529" } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBeDefined();
    });
  });
});
