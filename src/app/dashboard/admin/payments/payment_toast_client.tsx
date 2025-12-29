"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

export default function PaymentsToastClient() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const approved = params.get("approved");
    const rejected = params.get("rejected");

    if (approved === "1") {
      toast.success("Pembayaran berhasil di-approve.");
    }

    if (rejected === "1") {
      toast.info("Pembayaran berhasil di-reject.");
    }

    if (approved === "1" || rejected === "1") {
      // bersihkan URL agar tidak muncul toast lagi saat refresh
      router.replace("/dashboard/admin/payments");
    }
  }, [params, router]);

  return null;
}
