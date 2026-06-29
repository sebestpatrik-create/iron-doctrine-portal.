import localFont from "next/font/local";
import "./globals.css";

// Fonts are served from our own origin (public/fonts) — no request ever leaves
// for Google, at build or runtime. Faster first paint, and no visitor IP handed
// to a third party (the Google Fonts GDPR snag, sidestepped entirely).
const anton = localFont({
  src: "../public/fonts/Anton-Regular.woff2",
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});
const oswald = localFont({
  src: "../public/fonts/Oswald-Variable.woff2",
  weight: "200 700",
  variable: "--font-oswald",
  display: "swap",
});
const spectral = localFont({
  src: [
    { path: "../public/fonts/Spectral-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Spectral-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Spectral-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Spectral-Italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/Spectral-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/Spectral-SemiBoldItalic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata = {
  title: "Iron Doctrine — Member Portal",
  description: "Old-school iron. Modern coaching.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${oswald.variable} ${spectral.variable}`}>
      <body>{children}</body>
    </html>
  );
}
