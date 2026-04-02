function formatAddress({ streetAddress1, streetAddress2, cityTown } = {}) {
  const parts = [streetAddress1, streetAddress2, cityTown]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return parts.join(", ");
}

module.exports = { formatAddress };
