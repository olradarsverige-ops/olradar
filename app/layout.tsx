
export const metadata = { title: "Ölradar", description: "Hitta bästa ölpriset nära dig" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="sv"><body style={{fontFamily:'system-ui, Arial, sans-serif'}}>{children}</body></html>;
}
