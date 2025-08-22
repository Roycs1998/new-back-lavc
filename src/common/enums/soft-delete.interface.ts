import { EntityStatus } from '../enums/entity-status.enum';

export interface SoftDeleteEntity {
  status: EntityStatus;
  deletedAt?: Date;
  deletedBy?: string;
}
