
export const metadata = { title: "Ölradar" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{margin:0, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial'}}>
        {children}
      </body>
    </html>
  );
}
