import {
  FilterQuery,
  PaginateModel,
  PaginateOptions,
  PaginateResult,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { SoftDeleteDocument, SoftDeleteModel } from 'mongoose-delete';

export class BaseRepository<T extends SoftDeleteDocument> {
  private model: SoftDeleteModel<T> & PaginateModel<T>;

  constructor(model: SoftDeleteModel<T> & PaginateModel<T>) {
    this.model = model;
  }

  create(data: Partial<T>): Promise<T> {
    return new this.model(data).save();
  }

  getList(
    query: FilterQuery<T> = {},
    projection?: Record<string, 0 | 1>,
    options?: { skip?: number; limit?: number },
  ): Promise<T[]> {
    return this.model
      .find(query, projection)
      .skip(options?.skip ?? 0)
      .limit(options?.limit ?? 10)
      .exec();
  }

  getById(
    id: string,
    projection?: Record<string, unknown> | string | string[],
    options?: QueryOptions,
  ): Promise<T | null> {
    return this.model.findById(id, projection, options || {}).exec();
  }

  update(
    id: string,
    data: UpdateQuery<T>,
    projection?: Record<string, number> | string | string[],
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { ...options, projection })
      .exec();
  }

  delete(id: string): Promise<{ deletedCount: number }> {
    return this.model.deleteOne({ _id: id }).exec();
  }

  paginate(
    query: FilterQuery<T>,
    options: PaginateOptions,
  ): Promise<PaginateResult<T>> {
    return this.model.paginate(query, options);
  }

  async restoreById(id: string): Promise<T | null> {
    await this.model.restore({ _id: id });
    return this.model.findById(id).exec();
  }
}
