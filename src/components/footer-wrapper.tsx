"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/footer";

const hiddenFooterPaths = ["/admin", "/teacher", "/parent", "/schoolbase-admin", "/accounting"];

export default function FooterWrapper() {
  const pathname = usePathname();

  if (hiddenFooterPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return <Footer />;
}
