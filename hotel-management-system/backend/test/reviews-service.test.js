const assert = require("node:assert/strict");
const path = require("node:path");

function loadServiceWithStubs({ authStoreStub = {}, reviewsStoreStub = {} } = {}) {
  const authStoreId = require.resolve(path.join(__dirname, "../src/modules/auth/authStore"));
  const reviewsStoreId = require.resolve(path.join(__dirname, "../src/modules/reviews/reviewsStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/reviews/reviewsService"));

  delete require.cache[serviceId];
  delete require.cache[authStoreId];
  delete require.cache[reviewsStoreId];

  require.cache[authStoreId] = {
    id: authStoreId,
    filename: authStoreId,
    loaded: true,
    exports: {
      findUserByEmail: async () => null,
      ...authStoreStub,
    },
  };

  require.cache[reviewsStoreId] = {
    id: reviewsStoreId,
    filename: reviewsStoreId,
    loaded: true,
    exports: {
      listReviews: async () => [],
      createReview: async (review) => review,
      ...reviewsStoreStub,
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/reviews/reviewsService"));
  return {
    service,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[authStoreId];
      delete require.cache[reviewsStoreId];
    },
  };
}

module.exports = [
  {
    name: "reviewsService.addReviewForUser: creates review with stored user name",
    fn: async () => {
      let created = null;
      const { service, cleanup } = loadServiceWithStubs({
        authStoreStub: {
          findUserByEmail: async () => ({ email: "u@example.com", fullName: "Uma User" }),
        },
        reviewsStoreStub: {
          createReview: async (review) => {
            created = review;
            return review;
          },
        },
      });

      try {
        const result = await service.addReviewForUser(
          { email: "u@example.com", role: "user" },
          { rating: 5, message: "Great food." }
        );
        assert.equal(result.userEmail, "u@example.com");
        assert.equal(result.userName, "Uma User");
        assert.equal(result.rating, 5);
        assert.equal(result.message, "Great food.");
        assert.ok(created.id);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "reviewsService.addReviewForUser: rejects missing auth",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStubs();
      try {
        await assert.rejects(() => service.addReviewForUser(null, { rating: 5, message: "x" }), /Unauthorized/);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "reviewsService.addReviewForUser: validates rating and message",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStubs();
      try {
        await assert.rejects(
          () => service.addReviewForUser({ email: "u@example.com" }, { rating: 0, message: "x" }),
          /rating must be between 1 and 5/
        );
        await assert.rejects(
          () => service.addReviewForUser({ email: "u@example.com" }, { rating: 4, message: "" }),
          /message is required/
        );
      } finally {
        cleanup();
      }
    },
  },
];
