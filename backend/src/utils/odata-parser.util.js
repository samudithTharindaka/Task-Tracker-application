const { ApiError } = require('../middleware/error.middleware');

const FILTERABLE_FIELDS = ['status', 'ownerId', 'projectId'];
const ORDERABLE_FIELDS = ['title', 'status', 'dueDate', 'createdAt', 'updatedAt', 'ownerId'];
const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'];

const DEFAULT_TOP = 20;
const MAX_TOP = 100;

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFilter(filterStr) {
  const where = {};

  if (!filterStr) return where;

  const clauses = filterStr.split(/\s+and\s+/i);

  for (const clause of clauses) {
    const match = clause.trim().match(/^(\w+)\s+eq\s+(.+)$/i);

    if (!match) {
      throw new ApiError(400, 'VALIDATION_ERROR', `Unsupported $filter clause: "${clause}"`);
    }

    const [, field, rawValue] = match;
    const value = stripQuotes(rawValue);

    if (!FILTERABLE_FIELDS.includes(field)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        `$filter does not support field "${field}". Supported fields: ${FILTERABLE_FIELDS.join(', ')}`
      );
    }

    if (field === 'status' && !VALID_STATUSES.includes(value)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        `Invalid status value "${value}". Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }

    where[field] = value;
  }

  return where;
}

function parseOrderBy(orderByStr) {
  if (!orderByStr) return undefined;

  return orderByStr.split(',').map((part) => {
    const tokens = part.trim().split(/\s+/);
    const field = tokens[0];
    const direction = (tokens[1] || 'asc').toLowerCase();

    if (!ORDERABLE_FIELDS.includes(field)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        `$orderby does not support field "${field}". Supported fields: ${ORDERABLE_FIELDS.join(', ')}`
      );
    }

    if (direction !== 'asc' && direction !== 'desc') {
      throw new ApiError(400, 'VALIDATION_ERROR', `$orderby direction must be "asc" or "desc", got "${direction}"`);
    }

    return { [field]: direction };
  });
}

function parsePositiveInt(value, paramName, fallback) {
  if (value === undefined) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${paramName} must be a non-negative integer`);
  }

  return parsed;
}

function parseODataQuery(query) {
  const where = parseFilter(query.$filter);
  const orderBy = parseOrderBy(query.$orderby);
  const skip = parsePositiveInt(query.$skip, '$skip', 0);
  let take = parsePositiveInt(query.$top, '$top', DEFAULT_TOP);

  if (take > MAX_TOP) take = MAX_TOP;

  return { where, orderBy, skip, take };
}

module.exports = { parseODataQuery };
