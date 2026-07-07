const { ApiError } = require('../middleware/error.middleware');

const FILTERABLE_FIELDS = ['status', 'ownerId', 'projectId', 'label'];
const ORDERABLE_FIELDS = ['title', 'status', 'dueDate', 'createdAt', 'updatedAt', 'ownerId'];
const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'];
const VALID_LABELS = ['Development', 'QA', 'UI/UX', 'Planing', 'Other', 'Dev Ops'];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

    if (field === 'label' && !VALID_LABELS.includes(value)) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        `Invalid label value "${value}". Must be one of: ${VALID_LABELS.join(', ')}`
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

function parsePositiveInt(value, paramName, fallback, min = 0) {
  if (value === undefined) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${paramName} must be an integer >= ${min}`);
  }

  return parsed;
}

// page/limit only — reused by plain-listing endpoints (e.g. Projects) that
// don't need $filter/$orderby's full machinery. `page` is 1-indexed; `skip`/
// `take` are derived from it for Prisma, and `page`/`limit` themselves are
// carried through so the controller can build the pagination metadata block.
function parsePagination(query) {
  const page = parsePositiveInt(query.page, 'page', 1, 1);
  let limit = parsePositiveInt(query.limit, 'limit', DEFAULT_LIMIT, 1);

  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, skip: (page - 1) * limit, take: limit };
}

function parseODataQuery(query) {
  const where = parseFilter(query.$filter);
  const orderBy = parseOrderBy(query.$orderby);
  const { page, limit, skip, take } = parsePagination(query);

  return { where, orderBy, skip, take, page, limit };
}

module.exports = { parseODataQuery, parsePagination };
