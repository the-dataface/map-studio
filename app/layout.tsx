import type React from "react"
import type { Metadata } from "next"
import {
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Oswald,
  Playfair_Display,
  Merriweather,
  Raleway,
  Poppins,
  Source_Sans_3 as Source_Sans_Pro,
} from "next/font/google"
import "./globals.css"

// Load Google Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-roboto" })
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" })
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato" })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" })
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" })
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather" })
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" })
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-poppins" })
const sourceSansPro = Source_Sans_Pro({ subsets: ["latin"], variable: "--font-source-sans-pro" })

export const metadata: Metadata = {
  title: "Map Studio",
  description: "Create beautiful maps with your data.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${oswald.variable} ${playfairDisplay.variable} ${merriweather.variable} ${raleway.variable} ${poppins.variable} ${sourceSansPro.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  )
}
