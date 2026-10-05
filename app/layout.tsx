import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"MixoDJ — Autonomous DJ",description:"Autonomous digital DJ that mixes music by crowd state."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}