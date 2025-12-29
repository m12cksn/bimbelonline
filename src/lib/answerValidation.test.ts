import { isInputAnswerCorrect } from "@/lib/answerValidation";

describe("isInputAnswerCorrect", () => {
  test("accepts case/spacing variations", () => {
    expect(isInputAnswerCorrect("Siku Siku", "siku-siku")).toBe(true);
  });

  test("accepts decimal for fraction", () => {
    expect(isInputAnswerCorrect("0.5", "1/2")).toBe(true);
  });

  test("accepts fraction for decimal", () => {
    expect(isInputAnswerCorrect("1/2", "0.5")).toBe(true);
  });

  test("uses last number as expected (equation)", () => {
    expect(isInputAnswerCorrect("5", "2 + 3 = 5")).toBe(true);
  });

  test("accepts thousand separators (dot)", () => {
    expect(isInputAnswerCorrect("10000", "10.000")).toBe(true);
  });

  test("accepts thousand separators (comma)", () => {
    expect(isInputAnswerCorrect("10,000", "10000")).toBe(true);
  });

  test("normalizes degree words", () => {
    expect(isInputAnswerCorrect("90", "90 derajat")).toBe(true);
  });

  test("normalizes degree symbols", () => {
    expect(isInputAnswerCorrect("90°", "90 deg")).toBe(true);
  });

  test("accepts alternative token in correct answer", () => {
    expect(
      isInputAnswerCorrect(
        "titik sudut dan sisi sudut",
        "titik sudut dan kaki/sisi sudut"
      )
    ).toBe(true);
  });

  test("accepts decimal for fraction 3/4", () => {
    expect(isInputAnswerCorrect("0.75", "3/4")).toBe(true);
  });

  test("accepts unicode fraction input", () => {
    expect(isInputAnswerCorrect("1/2", "½")).toBe(true);
  });

  test("accepts fraction for decimal 0.125", () => {
    expect(isInputAnswerCorrect("1/8", "0.125")).toBe(true);
  });

  test("accepts comparison symbol answers", () => {
    expect(isInputAnswerCorrect("<", "<")).toBe(true);
  });
});
