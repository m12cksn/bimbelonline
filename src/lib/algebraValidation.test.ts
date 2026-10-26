import { isInputAnswerCorrect } from "./answerValidation";

describe("supported algebra answers", () => {
  test.each([
    ["y=2, x=3", "x=3, y=2"],
    ["y = 2; x = 3", "x=3, y=2"],
    ["y=2 dan x=3", "x=3, y=2"],
    ["x=0.5", "x=1/2"],
    ["y=2; x=0,5", "x=1/2, y=2"],
    ["x=-1.5", "x=-1 1/2"],
    ["2(x+3)", "2x+6"],
    ["6+2*x", "2x+6"],
    ["(x+1)(x-1)", "x^2-1"],
    ["(x+1)^2", "x²+2x+1"],
    ["2a+3a", "5a"],
    ["(3a)(3a)(3a)(3a)", "81a^4"],
    ["2xy+yx", "3xy"],
    ["-(-x)", "x"],
    ["-(x+2)", "-x-2"],
    ["x/2+x/2", "x"],
    ["x*(1/2)", "0.5x"],
    ["y=1+2x", "y=2x+1"],
    ["y=x/2+1", "y=0.5x+1"],
    ["x^2+x^2", "2x²"],
    ["x-x", "0x"],
    ["2×(x+3)", "2x+6"],
    ["x÷2", "0.5x"],
  ])("accepts %s as equivalent to %s", (answer, key) => {
    expect(isInputAnswerCorrect(answer, key)).toBe(true);
  });

  test.each([
    ["x=2,y=3", "x=3,y=2"],
    ["x=3", "x=3,y=2"],
    ["3", "x=3"],
    ["x=3,y=2,z=0", "x=3,y=2"],
    ["x=3,x=3,y=2", "x=3,y=2"],
    ["X=3,y=2", "x=3,y=2"],
    ["x=99 3", "x=3"],
    ["y=2,x=0.50000000000000000001", "x=1/2,y=2"],
    ["2(x+2)", "2x+6"],
    ["(x+1)^2", "x²+1"],
    ["x+6", "2x+6"],
    ["3x", "3y"],
    ["-x^2", "x^2"],
    ["1 2x", "12x"],
    ["x^2+1", "x²-1"],
    ["x/x", "0x+1"],
    ["(x^2-1)/(x-1)", "x+1"],
    ["x/0", "x"],
    ["x+0^0", "x+1"],
    ["x^-1", "x"],
    ["x^99999999", "x"],
    ["sin(x)", "x"],
    ["globalThis.process.exit()", "x"],
    ["x; alert(1)", "x"],
    ["x=3,y=2; extra", "x=3,y=2"],
    ["2x+6=0", "2x+6"],
    ["x".repeat(501), "x"],
    ["((((((2^8)^8)^8)^8)^8)^8)x", "x"],
  ])("rejects %s for %s", (answer, key) => {
    expect(isInputAnswerCorrect(answer, key)).toBe(false);
  });

  test("does not alter unsupported inequality grading", () => {
    expect(isInputAnswerCorrect("x<=5", "x ≤ 5")).toBe(true);
    expect(isInputAnswerCorrect("x<5", "x ≤ 5")).toBe(false);
  });
});
