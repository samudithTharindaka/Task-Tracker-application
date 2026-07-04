function buildODataResponse(contextPath, count, items) {
  return {
    '@odata.context': contextPath,
    '@odata.count': count,
    value: items,
  };
}

module.exports = { buildODataResponse };
