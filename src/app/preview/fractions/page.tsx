import type { Metadata } from "next";
import FractionPreview from "./preview";
export const metadata: Metadata = { title: "Pratinjau latihan visual", robots: { index: false, follow: false } };
export default function Page() { return <FractionPreview />; }
