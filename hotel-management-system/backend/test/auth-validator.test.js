const assert = require("node:assert/strict");

const { validateSignup, validateLogin } = require("../src/modules/auth/validators/authValidator");

module.exports = [
  {
    name: "authValidator.validateLogin: requires email and password",
    fn: () => {
      const res = validateLogin({ email: "", password: "" });
      assert.equal(res.ok, false);
    },
  },
  {
    name: "authValidator.validateLogin: normalizes email",
    fn: () => {
      const res = validateLogin({ email: " Test@Email.COM ", password: "x" });
      assert.equal(res.ok, true);
      assert.equal(res.value.email, "test@email.com");
    },
  },
  {
    name: "authValidator.validateLogin: rejects invalid email format",
    fn: () => {
      const res = validateLogin({ email: "not-an-email", password: "Password1" });
      assert.equal(res.ok, false);
    },
  },
  {
    name: "authValidator.validateLogin: preserves password whitespace",
    fn: () => {
      const res = validateLogin({ email: "test@example.com", password: " Password1 " });
      assert.equal(res.ok, true);
      assert.equal(res.value.password, " Password1 ");
    },
  },
  {
    name: "authValidator.validateSignup: rejects weak password",
    fn: () => {
      const res = validateSignup({
        fullName: "Ab",
        email: "a@b.com",
        password: "password",
        phone: "0771234567",
        streetAddress1: "No 1",
        streetAddress2: "",
        cityTown: "Colombo",
      });
      assert.equal(res.ok, false);
    },
  },
  {
    name: "authValidator.validateSignup: returns normalized payload",
    fn: () => {
      const res = validateSignup({
        fullName: " Test User ",
        email: " TEST@EXAMPLE.COM ",
        password: "Password1",
        phone: "0771234567",
        streetAddress1: "No 1",
        streetAddress2: "Lane",
        cityTown: "Colombo",
      });
      assert.equal(res.ok, true);
      assert.equal(res.value.email, "test@example.com");
      assert.ok(res.value.address.includes("No 1"));
    },
  },
];
