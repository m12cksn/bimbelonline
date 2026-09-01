import MathCheckupResultClient from "./result_client";

type Props = { params: Promise<{ attemptId: string }> };

export default async function MathCheckupResultPage({ params }: Props) {
  const { attemptId } = await params;
  return <MathCheckupResultClient attemptId={attemptId} />;
}
