import MathCheckupPdfClient from "./pdf_client";

type Props = { params: Promise<{ attemptId: string }> };

export default async function MathCheckupPdfPage({ params }: Props) {
  const { attemptId } = await params;
  return <MathCheckupPdfClient attemptId={attemptId} />;
}
