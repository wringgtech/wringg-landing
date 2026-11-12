import assert from "node:assert/strict";
import test from "node:test";
import {
  OTP_BLANK,
  applyOtpValue,
  clampStepper,
  cx,
  digitsOnly,
  isOtpComplete,
  maskPhone,
  parseStepperInput,
  removeOtpDigit,
  sanitizeStepperDraft,
} from "../src/components/customer/ui-helpers.ts";

test("digitsOnly strips separators from pasted text", () => {
  assert.equal(digitsOnly("12 34 5"), "12345");
  assert.equal(digitsOnly("a1b2"), "12");
  assert.equal(digitsOnly(""), "");
});

test("applyOtpValue fills from the focused box and spreads pasted digits", () => {
  assert.equal(applyOtpValue("", 0, "4", 6), "4     ");
  assert.equal(applyOtpValue("42    ", 2, "7", 6), "427   ");
  // A full OTP arriving in box 0 (SMS autofill / paste) spreads across all boxes.
  assert.equal(applyOtpValue("", 0, "987654", 6), "987654");
  // A long paste from box 2 (index 1) overwrites that box onward, truncated;
  // box 1 keeps its blank slot — nothing shifts.
  assert.equal(applyOtpValue(`${OTP_BLANK}2    `, 1, "3456789", 6), `${OTP_BLANK}34567`);
  // A non-digit keystroke clears just the current slot; positions survive.
  assert.equal(applyOtpValue("12 456", 2, "x", 6), "12 456");
});

test("placeholders never let later digits shift", () => {
  // Clearing the middle digit keeps 4,5,6 in their original slots.
  const cleared = applyOtpValue("123456", 2, "x", 6);
  assert.equal(cleared, `12${OTP_BLANK}456`);
  assert.equal(cleared[3], "4");
  assert.equal(cleared[5], "6");
  // Retyping the middle digit repairs the code in place.
  assert.equal(applyOtpValue(cleared, 2, "3", 6), "123456");
});

test("removeOtpDigit blanks one slot without shifting the others", () => {
  const removed = removeOtpDigit("123456", 2, 6);
  assert.equal(removed, `12${OTP_BLANK}456`);
  assert.equal(removed[3], "4");
  assert.equal(removeOtpDigit("1     ", 0, 6), `${OTP_BLANK}     `);
  assert.equal(removeOtpDigit("", 0, 6), `${OTP_BLANK}     `.slice(0, 6));
});

test("isOtpComplete accepts only full digit strings", () => {
  assert.equal(isOtpComplete("123456", 6), true);
  assert.equal(isOtpComplete(`12${OTP_BLANK}456`, 6), false);
  assert.equal(isOtpComplete("", 6), false);
});

test("clampStepper keeps values inside the range", () => {
  assert.equal(clampStepper(7, 0, 20), 7);
  assert.equal(clampStepper(-3, 0, 20), 0);
  assert.equal(clampStepper(99, 0, 20), 20);
  assert.equal(clampStepper(Number.NaN, 5, 20), 5);
});

test("stepper draft keeps only digits and parseStepperInput clamps on commit", () => {
  assert.equal(sanitizeStepperDraft("1a2b3"), "123");
  assert.equal(sanitizeStepperDraft(""), "");
  assert.equal(parseStepperInput("12", 0, 20), 12);
  assert.equal(parseStepperInput(" 8 ", 0, 20), 8);
  assert.equal(parseStepperInput("12.5", 0, 20), null);
  assert.equal(parseStepperInput("", 0, 20), null);
  assert.equal(parseStepperInput("99", 0, 20), 20);
});

test("maskPhone reveals only country code and last four digits", () => {
  assert.equal(maskPhone("+919876543210"), "+91 •••• 3210");
  assert.equal(maskPhone("9876543210"), "98 •••• 3210");
  assert.equal(maskPhone("123"), "123");
  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone(null), "");
});

test("cx joins only truthy class names", () => {
  assert.equal(cx("a", false, undefined, "b", null), "a b");
  assert.equal(cx(), "");
});
