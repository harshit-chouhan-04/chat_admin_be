import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  addObjectIdFilter,
  buildSort,
  createPaginatedResponse,
  getPagination,
} from 'src/common/utils/query.util';
import { QueryInvoicesDto } from '../dtos/query-invoices.dto';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
  ) {}

  async findAll(query: QueryInvoicesDto) {
    const filter: Record<string, unknown> = {};
    addObjectIdFilter(filter, 'user', query.user);
    if (query.status) {
      filter.status = query.status;
    }

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .populate('user', 'name email username avatarUrl')
        .populate('plan', 'name price billingCycle credits messageLimit')
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.invoiceModel.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('user', 'name email username avatarUrl')
      .populate('plan', 'name price billingCycle credits messageLimit')
      .lean();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
