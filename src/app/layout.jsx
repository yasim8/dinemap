import "./globals.css";

export const metadata = {
  title: "DineMap — Lahore's Food Guide",
  description: "Find restaurants, browse full menus, and discover bank card discounts across Lahore.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
