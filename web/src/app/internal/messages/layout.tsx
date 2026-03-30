import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operator messages — 1ST0P",
  robots: { index: false, follow: false },
};

export default function InternalMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
