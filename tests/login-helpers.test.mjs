import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidIndianMobile,
  isValidOtp,
  maskPhone,
  sanitizeOtpInput,
  sanitizePhoneInput,
  toE164Phone,
  validateEmail,
  validateFullName,
} from "../src/app/login/login-helpers.ts";

// --- Phone validation ---------------------------------------------------------

test("accepts valid 10-digit Indian mobile numbers starting 6-9", () => {
  assert.equal(isValidIndianMobile("9876543210"), true);
  assert.equal(isValidIndianMobile("6000000000"), true);
  assert.equal(isValidIndianMobile("9999999999"), true);
});

test("rejects numbers not starting 6-9 and wrong lengths", () => {
  assert.equal(isValidIndianMobile("1234567890"), false);
  assert.equal(isValidIndianMobile("5987654321"), false);
  assert.equal(isValidIndianMobile("987654321"), false);
  assert.equal(isValidIndianMobile("98765432101"), false);
  assert.equal(isValidIndianMobile(""), false);
  assert.equal(isValidIndianMobile("98765abcd0"), false);
});

// --- Phone sanitising / E.164 ---------------------------------------------------

test("keeps plain 10-digit input, including ones starting with 91", () => {
  assert.equal(sanitizePhoneInput("98765 43210"), "9876543210");
  assert.equal(sanitizePhoneInput("9876543210"), "9876543210");
  // A bare 10-digit number that starts with 91 is not a full-form prefix —
  // no stripping, or the last two real digits would be cut.
  assert.equal(sanitizePhoneInput("9123456789"), "9123456789");
});

test("strips recognised country and trunk prefixes", () => {
  assert.equal(sanitizePhoneInput("+91 98765 43210"), "9876543210");
  assert.equal(sanitizePhoneInput("00919876543210"), "9876543210");
  assert.equal(sanitizePhoneInput("09876543210"), "9876543210");
});

test("caps at 10 digits and drops non-digits", () => {
  assert.equal(sanitizePhoneInput("98765432109999"), "9876543210");
  assert.equal(sanitizePhoneInput("abc"), "");
});

test("formats the E.164 phone sent to the backend", () => {
  assert.equal(toE164Phone("9876543210"), "+919876543210");
});

// --- OTP ----------------------------------------------------------------------

test("accepts exactly six digits as the OTP", () => {
  assert.equal(isValidOtp("123456"), true);
  assert.equal(isValidOtp("000000"), true);
  assert.equal(isValidOtp("12345"), false);
  assert.equal(isValidOtp("1234567"), false);
  assert.equal(isValidOtp("12 456"), false);
  assert.equal(isValidOtp(""), false);
});

test("sanitises OTP input to at most six digits", () => {
  assert.equal(sanitizeOtpInput("1 2a3"), "123");
  assert.equal(sanitizeOtpInput("1234567890"), "123456");
  assert.equal(sanitizeOtpInput(""), "");
});

// --- Name and email validation -------------------------------------------------

test("requires 2-80 characters after trimming for the full name", () => {
  assert.equal(validateFullName("  Aravind Kumar "), null);
  assert.equal(validateFullName("A"), "Please enter your full name (at least 2 letters).");
  assert.equal(validateFullName("   "), "Please enter your full name (at least 2 letters).");
  assert.equal(validateFullName("A".repeat(81)), "Please enter 80 characters or fewer.");
  assert.equal(validateFullName("A".repeat(80)), null);
});

test("treats email as optional but validates it when present", () => {
  assert.equal(validateEmail(""), null);
  assert.equal(validateEmail("   "), null);
  assert.equal(validateEmail("aravind@example.com"), null);
  assert.equal(validateEmail("aravind.k+receipts@sub.example.co.in"), null);
  assert.ok(validateEmail("aravind@example"), "local@nodot must be rejected");
  assert.ok(validateEmail("aravind example.com"), "a space must be rejected");
  assert.ok(validateEmail("@example.com"), "missing local part must be rejected");
});

// --- Masked phone display ------------------------------------------------------

test("masks a phone number as +91 XXXXX XXXXX", () => {
  assert.equal(maskPhone("+919876543210"), "+91 98765 43210");
  assert.equal(maskPhone("9876543210"), "+91 98765 43210");
  assert.equal(maskPhone("+91 98765-43210"), "+91 98765 43210");
});

test("passes malformed phone numbers through unmasked rather than guessing", () => {
  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone("12345"), "12345");
});
