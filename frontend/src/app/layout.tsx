export const metadata = {
  title: 'Image Processor',
  description: 'Upload, preview styles, and generate final PNG',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
