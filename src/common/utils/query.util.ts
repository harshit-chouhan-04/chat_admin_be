import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSort(
  sort?: string,
  order: 'asc' | 'desc' = 'desc',
): Record<string, 1 | -1> {
  return {
    [sort || 'createdAt']: order === 'asc' ? 1 : -1,
  };
}

export function getPagination(query: PaginationQueryDto): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  query: PaginationQueryDto,
): PaginatedResponse<T> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export function toObjectId(value: string, field = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`Invalid ${field}`);
  }

  return new Types.ObjectId(value);
}

export function addObjectIdFilter<T>(
  filter: Record<string, unknown>,
  field: keyof T | string,
  value?: string,
) {
  if (!value) {
    return;
  }

  filter[String(field)] = toObjectId(value, String(field));
}
