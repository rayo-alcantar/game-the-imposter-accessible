import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Impostor",
  description:
    "Juego social en línea inspirado en el impostor clásico. Usa tu voz, no el chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="app-root">
          {children}
          <footer className="app-footer">
            <p>Impostor accesible para personas con discapacidad visual.</p>
            <p>
              Desarrollado por <strong>Angel Alcantar</strong>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
