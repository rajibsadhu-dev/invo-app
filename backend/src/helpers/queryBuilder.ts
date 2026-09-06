/**
 * Generic Prisma query builder that parses Neocore-style filter strings into
 * Prisma `where` clauses. All filters are ANDed together.
 *
 * Supported operators: =, !=, >, <, >=, <=, like, not like, is null, is not null
 *
 * Usage:
 *   GET /invoices?filter[]=status = 'paid'&filter[]=grandTotal > 1000&sort=-invoiceDate&page=1&limit=20
 */

const MAX_PAGE_SIZE = 100;

// Operators ordered longest-first so the regex matches greedily.
const OPERATORS = [
  "is not null",
  "not like",
  "is null",
  "like",
  "!=",
  ">=",
  "<=",
  ">",
  "<",
  "=",
] as const;

type Operator = (typeof OPERATORS)[number];

type ParsedFilter = {
  field: string;
  operator: Operator;
  value: string | null;
};

const OPERATOR_PATTERN = new RegExp(
  `^\\s*([\\w]+)\\s+(${OPERATORS.join("|")})\\s*(.*)$`,
  "i"
);

function parseFilterString(raw: string): ParsedFilter {
  const match = raw.match(OPERATOR_PATTERN);
  if (!match) {
    throw new Error(`Invalid filter: "${raw}"`);
  }

  const field = match[1].trim();
  const operator = match[2].trim().toLowerCase() as Operator;
  const rawValue = match[3]?.trim() ?? null;

  // Unary operators have no value
  if (operator === "is null" || operator === "is not null") {
    return { field, operator, value: null };
  }

  if (!rawValue) {
    throw new Error(`Missing value in filter: "${raw}"`);
  }

  // Strip surrounding quotes from value
  const value = rawValue.replace(/^['"]|['"]$/g, "");
  return { field, operator, value };
}

function toPrismaCondition(
  parsed: ParsedFilter,
  allowedFields: Set<string>
): Record<string, unknown> | null {
  if (!allowedFields.has(parsed.field)) return null;

  const { field, operator, value } = parsed;

  // Coerce numeric values when the value looks numeric
  const coerced = value !== null && /^-?\d+(\.\d+)?$/.test(value)
    ? Number(value)
    : value;

  switch (operator) {
    case "=":
      return { [field]: { equals: coerced } };
    case "!=":
      return { [field]: { not: coerced } };
    case ">":
      return { [field]: { gt: coerced } };
    case "<":
      return { [field]: { lt: coerced } };
    case ">=":
      return { [field]: { gte: coerced } };
    case "<=":
      return { [field]: { lte: coerced } };
    case "like":
      return { [field]: { contains: value } };
    case "not like":
      return { [field]: { not: { contains: value } } };
    case "is null":
      return { [field]: null };
    case "is not null":
      return { [field]: { not: null } };
    default:
      return null;
  }
}

export type QueryOptions = {
  /** Raw filter strings from query params */
  filters?: string | string[];
  /** Sort field. Prefix with - for DESC, e.g. "-invoiceDate" */
  sort?: string;
  page?: string | number;
  limit?: string | number;
  /** Whitelist of filterable field names */
  allowedFields: string[];
  /** Whitelist of sortable field names */
  allowedSortFields: string[];
  /** Default sort field if none provided */
  defaultSort?: string;
  /** Default sort order */
  defaultOrder?: "asc" | "desc";
  /** Additional Prisma where conditions to always apply (e.g. organizationId, soft-delete) */
  baseWhere?: Record<string, unknown>;
};

export type QueryResult = {
  where: Record<string, unknown>;
  orderBy: Record<string, "asc" | "desc">;
  skip: number;
  take: number;
  page: number;
  limit: number;
};

export function buildQuery(opts: QueryOptions): QueryResult {
  const allowedFieldSet = new Set(opts.allowedFields);
  const allowedSortSet = new Set(opts.allowedSortFields);

  // Parse filters
  const rawFilters = opts.filters
    ? Array.isArray(opts.filters)
      ? opts.filters
      : [opts.filters]
    : [];

  const conditions: Record<string, unknown>[] = [];
  for (const raw of rawFilters) {
    const parsed = parseFilterString(raw);
    const condition = toPrismaCondition(parsed, allowedFieldSet);
    if (condition) {
      conditions.push(condition);
    }
  }

  // Build where
  const where: Record<string, unknown> = {
    ...(opts.baseWhere ?? {}),
    ...(conditions.length > 0 ? { AND: conditions } : {}),
  };

  // Parse sort
  let sortField = opts.defaultSort ?? "createdAt";
  let sortOrder: "asc" | "desc" = opts.defaultOrder ?? "desc";

  if (opts.sort) {
    const sortStr = opts.sort.trim();
    if (sortStr.startsWith("-")) {
      sortField = sortStr.slice(1);
      sortOrder = "desc";
    } else {
      sortField = sortStr;
      sortOrder = "asc";
    }
    if (!allowedSortSet.has(sortField)) {
      sortField = opts.defaultSort ?? "createdAt";
      sortOrder = opts.defaultOrder ?? "desc";
    }
  }

  const orderBy = { [sortField]: sortOrder };

  // Pagination
  const limit = Math.min(
    Math.max(Number(opts.limit) || 10, 1),
    MAX_PAGE_SIZE
  );
  const page = Math.max(Number(opts.page) || 1, 1);
  const skip = (page - 1) * limit;

  return { where, orderBy, skip, take: limit, page, limit };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
