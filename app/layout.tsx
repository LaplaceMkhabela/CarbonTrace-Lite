import "./globals.css";
import Nav from "./components/Nav";

export const metadata = {
  title: "CarbonTrace Lite",
  description: "A verifiable community carbon ledger — cross-check environmental claims against independent data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}