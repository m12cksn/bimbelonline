import { isInputAnswerCorrect, normalizeFraction } from "@/lib/answerValidation";

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

describe("strict mathematical answer matching", () => {
  test.each([
    ["2", "2 + 3 = 5"],
    ["3", "2 + 3 = 5"],
    ["99 0.5", "1/2"],
    ["1 2 3 4 5", "5"],
    ["1/2", "2"],
    ["2/3", "2"],
    ["1/0", "1"],
    ["1/0", "1/0"],
    ["0.333333333", "1/3"],
    ["-0.5", "1/2"],
    ["1/2", "-1/2"],
    ["1", "1 1/2"],
    ["1/2", "1 1/2"],
    ["0", "-0 1/2"],
    ["3/4", "3/4 meter"],
    ["5", "5x+1"],
    ["3", "x=3, y=2"],
    ["3", "3 sisi dan 3 sudut"],
    ["70", "Modus 70, median 70, rata-rata 74"],
    ["90 cm", "90 derajat"],
    ["90 derajat", "90"],
    ["tidak siku-siku", "siku-siku"],
    ["tidak lebih besar", "lebih besar"],
    ["NaN", "NaN"],
    ["Infinity", "Infinity"],
    ["1e3", "1000"],
    ["12..34", "1234"],
    ["1.2.3", "1.2.3"],
    ["3,14,15", "3.14"],
    ["-1", "1"],
    ["5%", "5"],
    ["75", "75%"],
    ["l ⊥ m", "l ∥ m"],
    ["", "0"],
    ["1/4", "1/4, 1/6, 1/8"],
    ["500", "500 + 70 + 2"],
    ["49", "49, 35"],
    ["0", null],
  ])("rejects %s for key %s", (answer, key) => {
    expect(isInputAnswerCorrect(answer!, key)).toBe(false);
  });

  test.each([
    ["2/4", "1/2"], ["0,5", "1/2"], ["0.500", "1/2"],
    ["1 1/2", "1.5"], ["1½", "3/2"], ["-1 1/2", "-1.5"],
    ["-0 1/2", "-0.5"], ["1/-2", "-0.5"], ["-1/-2", "0.5"],
    ["\\frac{2}{4}", "½"], ["75%", "0.75"], ["0,75", "75%"],
    ["-10.000", "-10000"], ["1.234.567", "1234567"],
    ["1,234,567", "1234567"], ["1.234,50", "1234.5"],
    ["1,234.50", "1234.5"], ["90", "90 derajat"],
    ["90°", "90 derajat"], ["24 cm²", "24 cm2"],
    ["Rp 10.000", "Rp 10000"], ["5", "2 + 3 = 5"],
    ["x=3, y=2", "x = 3, y = 2"],
    ["benar", "ya/benar"],
    ["1/2", "¹⁄₂"], ["14/3", "⁵⁶⁄₁₂"],
    ["1/4, 1/6, 1/8", "1/4, 1/6, 1/8"],
    ["500+70+2", "500 + 70 + 2"],
    ["2+3=5", "2 + 3 = 5"],
    ["49,35", "49, 35"],
  ])("accepts the complete equivalent %s for %s", (answer, key) => {
    expect(isInputAnswerCorrect(answer, key)).toBe(true);
  });

  test("does not accept nearby decimals by floating point tolerance", () => {
    expect(isInputAnswerCorrect("0.50000000000000000001", "0.5")).toBe(false);
  });

  test("fraction normalization requires the full fraction and safe integers", () => {
    expect(normalizeFraction("2/4")).toEqual({ numerator: 1, denominator: 2, label: "1/2" });
    expect(normalizeFraction("wrong 2/4 extra")).toBeNull();
    expect(normalizeFraction("1/0")).toBeNull();
    expect(normalizeFraction("9007199254740993/1")).toBeNull();
  });

  test("bounds input before numeric parsing", () => {
    expect(isInputAnswerCorrect("9".repeat(4000), "9")).toBe(false);
    expect(isInputAnswerCorrect("9".repeat(100), "9".repeat(100))).toBe(false);
  });
});
