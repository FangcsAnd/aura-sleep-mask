import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Aura - 智能睡眠眼罩',
  description: '智能光疗眼罩专属应用，提供正念冥想、共振呼吸、4-7-8助眠及差旅时差调整功能。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} dark`}>
      <body className="bg-black text-white antialiased overflow-hidden selection:bg-white/20">
        {children}
      </body>
    </html>
  );
}
