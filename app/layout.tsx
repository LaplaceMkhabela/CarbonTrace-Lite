import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata = {
  title: "CarbonTrace Lite",
  description: "A verifiable community carbon ledger — cross-check environmental claims against independent data.",
};

// Runs before paint so the saved theme applies without a flash.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('ct-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <ThemeProvider>
          <Nav />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
