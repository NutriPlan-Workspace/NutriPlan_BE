import {
  FilterQuery,
  PaginateModel,
  PaginateOptions,
  PaginateResult,
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

  getList(query: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(query).exec();
  }

  getById(id: string): Promise<T | null> {
    return this.model.findOne({ _id: id }).exec();
  }

  update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
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
