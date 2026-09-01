import MathCheckupTestClient from "./test_client";

type Props = { params: Promise<{ attemptId: string }> };

export default async function MathCheckupTestPage({ params }: Props) {
  const { attemptId } = await params;
  return <MathCheckupTestClient attemptId={attemptId} />;
}
