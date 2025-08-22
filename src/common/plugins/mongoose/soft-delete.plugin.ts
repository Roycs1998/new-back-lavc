import { Schema as MongooseSchema, Types } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export function softDeletePlugin(
  schema: MongooseSchema,
  opts?: { disable?: boolean },
) {
  if (opts?.disable || (schema as any).options?.skipSoftDeletePlugin) return;

  schema.add({
    status: {
      type: String,
      enum: Object.values(EntityStatus),
      default: EntityStatus.ACTIVE,
      index: true,
    },
    deletedAt: { type: Date },
    deletedBy: { type: Types.ObjectId, ref: 'User' },
  });

  schema.methods.softDelete = function (by?: string) {
    this.status = EntityStatus.DELETED;
    this.deletedAt = new Date();
    this.deletedBy = by;
    return this;
  };
}
