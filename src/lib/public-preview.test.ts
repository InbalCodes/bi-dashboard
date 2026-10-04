import { strict as assert } from "node:assert";
import test from "node:test";

import { canAccessWithoutLogin, isPublicPreviewEnabled } from "./public-preview";

test("public preview allows dashboard and non-admin routes without login", () => {
  process.env.PUBLIC_PREVIEW = "true";

  assert.equal(isPublicPreviewEnabled(), true);
  assert.equal(canAccessWithoutLogin("/dashboard"), true);
  assert.equal(canAccessWithoutLogin("/insights"), true);
  assert.equal(canAccessWithoutLogin("/api/metrics"), true);
  assert.equal(canAccessWithoutLogin("/settings"), false);
  assert.equal(canAccessWithoutLogin("/api/sync"), false);
  assert.equal(canAccessWithoutLogin("/api/auth/login"), true);
});

test("public preview stays disabled when env flag is off", () => {
  process.env.PUBLIC_PREVIEW = "false";

  assert.equal(isPublicPreviewEnabled(), false);
  assert.equal(canAccessWithoutLogin("/dashboard"), false);
});
