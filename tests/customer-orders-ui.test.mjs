import assert from "node:assert/strict";
import test from "node:test";
import {
  activeOrdersLabel,
  itemCountLabel,
  statusToneFor,
} from "../src/app/orders/orders-ui.ts";

test("delivered orders are green, cancelled red, the rest in progress", () => {
  assert.equal(statusToneFor("delivered"), "success");
  assert.equal(statusToneFor("cancelled"), "danger");
  assert.equal(statusToneFor("placed"), "info");
  assert.equal(statusToneFor("out_for_delivery"), "info");
  assert.equal(statusToneFor("washing"), "info");
  assert.equal(statusToneFor("something_new"), "info");
});

test("pluralizes the active-order count", () => {
  assert.equal(activeOrdersLabel(1), "1 active order");
  assert.equal(activeOrdersLabel(8), "8 active orders");
  assert.equal(activeOrdersLabel(0), "0 active orders");
});

test("pluralizes clothes in list rows", () => {
  assert.equal(itemCountLabel(1), "1 cloth");
  assert.equal(itemCountLabel(18), "18 clothes");
});
