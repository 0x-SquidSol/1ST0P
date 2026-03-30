import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — 1ST0P",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
