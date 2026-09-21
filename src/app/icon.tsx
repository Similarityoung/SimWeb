import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#faf9f6",
        color: "#1b1815",
        fontSize: 34,
        fontWeight: 600,
      }}
    >
      sy<span style={{ color: "#b84225" }}>.</span>
    </div>,
    size,
  );
}
