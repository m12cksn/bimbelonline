import Swal from "sweetalert2";

type ConfirmOptions = {
  title?: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "warning" | "question" | "info" | "success" | "error";
};

export async function confirmAction({
  title = "Konfirmasi",
  text,
  confirmText = "Ya",
  cancelText = "Batal",
  icon = "warning",
}: ConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
  });
  return result.isConfirmed;
}
