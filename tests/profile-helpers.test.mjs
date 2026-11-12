import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProfileUpdatePayload,
  dueReasonLabel,
  memberSinceLabel,
  shouldShowDues,
  shouldShowStats,
  totalDueValue,
  validateProfileDraft,
} from "../src/app/account/profile-helpers.ts";
import { formatRupees, formatRupeesExact, formatRupeesIndian } from "../src/lib/washmate/pricing.ts";
import {
  formatPhoneDisplay,
  initialsFor,
  maskPhone,
  pluralize,
} from "../src/components/customer/ui-helpers.ts";

// --- Profile edit payload rules -----------------------------------------------

/** Same shape as ProfileDraft in profile-helpers.ts, kept as plain JS here. */
const draft = (partial) => ({
  fullName: "Asha Rao",
  displayName: "",
  email: "",
  ...partial,
});

test("payload always sends the trimmed full name", () => {
  assert.deepEqual(buildProfileUpdatePayload(draft({ fullName: "  Asha Rao  " }), null), {
    fullName: "Asha Rao",
  });
});

test("a non-empty field is sent, even when it matches the loaded value", () => {
  const payload = buildProfileUpdatePayload(
    draft({ email: " same@old.in " }),
    { displayName: "Asha", email: "same@old.in" },
  );
  assert.equal(payload.email, "same@old.in");
  // displayName was emptied here and the load HAD "Asha" → explicit clear.
  assert.equal(payload.displayName, null);
});

test("a cleared field that the load showed sends an explicit null", () => {
  const payload = buildProfileUpdatePayload(draft({ email: "   " }), {
    displayName: null,
    email: "old@wringg.in",
  });
  assert.equal(payload.email, null);
  assert.equal("displayName" in payload, false);
});

test("an empty field that was never loaded sends nothing (the data-loss guard)", () => {
  const payload = buildProfileUpdatePayload(draft(), { displayName: null, email: null });
  // No stored value was ever seen, so nothing may be cleared or sent.
  assert.deepEqual(payload, { fullName: "Asha Rao" });
});

test("a failed read (loaded = null) never produces clearing keys either", () => {
  // The form reaches this path when the load errored: no key but fullName.
  assert.deepEqual(buildProfileUpdatePayload(draft({ email: "" }), null), {
    fullName: "Asha Rao",
  });
});

// --- Validation ----------------------------------------------------------------

test("full name is required, 2–80 characters", () => {
  assert.match(validateProfileDraft(draft({ fullName: "" })).fullName ?? "", /required/i);
  assert.match(validateProfileDraft(draft({ fullName: " A " })).fullName ?? "", /2–80/);
  const long = "x".repeat(81);
  assert.match(validateProfileDraft(draft({ fullName: long })).fullName ?? "", /2–80/);
  assert.equal(validateProfileDraft(draft({ fullName: "Asha Rao" })).fullName, undefined);
  assert.equal(validateProfileDraft(draft({ fullName: "  Li  " })).fullName, undefined);
});

test("email is optional but must look like an email", () => {
  assert.equal(validateProfileDraft(draft({ email: "" })).email, undefined);
  assert.equal(validateProfileDraft(draft({ email: " a@b.in " })).email, undefined);
  assert.match(validateProfileDraft(draft({ email: "not-an-email" })).email ?? "", /valid email/i);
  assert.match(validateProfileDraft(draft({ email: "a@b" })).email ?? "", /valid email/i);
});

// --- Dues visibility ------------------------------------------------------------

test("the dues section only shows for a real positive total", () => {
  assert.equal(shouldShowDues("0.00"), false);
  assert.equal(shouldShowDues("0"), false);
  assert.equal(shouldShowDues(""), false);
  assert.equal(shouldShowDues("junk"), false);
  assert.equal(shouldShowDues("-5.00"), false);
  assert.equal(shouldShowDues("12.50"), true);
  assert.equal(shouldShowDues("1.00"), true);
  assert.equal(totalDueValue("12.50"), 12.5);
  assert.equal(totalDueValue("junk"), 0);
});

test("due amounts render with two decimals (formatRupeesExact) and reason maps safely", () => {
  assert.equal(formatRupeesExact("340"), "₹340.00");
  assert.equal(formatRupeesExact("12.5"), "₹12.50");
  assert.equal(formatRupeesExact(""), "₹0.00");
  assert.equal(formatRupeesExact(null), "₹0.00");
  assert.equal(formatRupees("340"), "₹340");

  assert.equal(dueReasonLabel("payment_pending_exception"), "Payment not collected on delivery");
  assert.equal(dueReasonLabel("something_new"), "Payment pending");
});

test("avatar initials take the first grapheme of the first and last word", () => {
  assert.equal(initialsFor("Aleksandra Wiśniewska-Kowalczyk"), "AW");
  assert.equal(initialsFor("Jo"), "J");
  assert.equal(initialsFor("Asha Rao"), "AR");
  assert.equal(initialsFor("  "), "?");
  assert.equal(initialsFor(null), "?");
  // Emoji-first names segment as whole graphemes, never lone "\uFFFD" halves.
  const emoji = initialsFor("😀 Priya");
  assert.ok(emoji.length >= 1 && emoji.includes("P"), `emoji initials sane: ${emoji}`);
  assert.ok(!emoji.includes("\uFFFD"), "no replacement character");
});

// --- Stats zero state -----------------------------------------------------------

/*
 * The offline rule is behaviour of useOnline() + CustomerShell (skip requests
 * while offline, retry on `online`); it is exercised in the browser. The
 * zero-state rule is pure and tested here: stats only when something is
 * non-zero, otherwise the Getting-started block.
 */
test("the stats row hides behind Getting started until a number is non-zero", () => {
  assert.equal(shouldShowStats(0, 0, 0), false);
  assert.equal(shouldShowStats(1, 0, 0), true);
  assert.equal(shouldShowStats(0, 2, 0), true);
  assert.equal(shouldShowStats(0, 0, 5), true);
});

test("membership line parses createdAt into 'Mon YYYY', never invents one", () => {
  assert.match(memberSinceLabel("2025-05-14T10:00:00Z") ?? "", /^Member since [A-Z][a-z]{2} 2025$/);
  assert.equal(memberSinceLabel(""), null);
  assert.equal(memberSinceLabel("not-a-date"), null);
  assert.equal(memberSinceLabel(undefined), null);
});

test("profile phone shows full +91 grouping (owner-facing), not the masked header form", () => {
  assert.equal(formatPhoneDisplay("+919876543210"), "+91 98765 43210");
  assert.equal(formatPhoneDisplay("9876543210"), "98765 43210");
  assert.equal(formatPhoneDisplay("123"), "123");
  assert.equal(formatPhoneDisplay(null), "");
  // The header keeps the privacy mask.
  assert.notEqual(formatPhoneDisplay("+919876543210"), maskPhone("+919876543210"));
});

// --- Pluralization and money (shared primitives) --------------------------------

test("pluralize picks singular only for exactly 1", () => {
  assert.equal(pluralize(1, "cloth", "clothes"), "cloth");
  assert.equal(pluralize(0, "cloth", "clothes"), "clothes");
  assert.equal(pluralize(2, "cloth", "clothes"), "clothes");
  assert.equal(pluralize(1, "order"), "order");
  assert.equal(pluralize(3, "order"), "orders");
});

test("Money's formatter groups Indian-style and trims bare paise", () => {
  assert.equal(formatRupeesIndian("500"), "₹500");
  assert.equal(formatRupeesIndian("500.00"), "₹500");
  assert.equal(formatRupeesIndian("1234.5"), "₹1,234.50");
  assert.equal(formatRupeesIndian("123456"), "₹1,23,456");
  assert.equal(formatRupeesIndian("1234567"), "₹12,34,567");
  assert.equal(formatRupeesIndian("0"), "₹0");
  assert.equal(formatRupeesIndian("junk"), "₹0");
  assert.equal(formatRupeesIndian(null), "₹0");
  // exact keeps two decimals for totals someone owes; formatRupees unchanged.
  assert.equal(formatRupeesExact("1234.5"), "₹1234.50");
  assert.equal(formatRupees("500.00"), "₹500");
});
