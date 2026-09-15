import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "linear-gradient(135deg, #1F3A5F 0%, #0F2238 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF6B35",
          borderRadius: "8px",
          border: "1.5px solid #FF6B35",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Ω
      </div>
    ),
    {
      ...size,
    }
  );
}
