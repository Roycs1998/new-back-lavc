import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { PersonType } from 'src/common/enums/person-type.enum';

export type PersonDocument = Person & Document;

@Schema({
  collection: 'persons',
  versionKey: false,
  discriminatorKey: 'type',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Person {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({
    type: String,
    enum: PersonType,
    required: true,
    index: true,
  })
  type: PersonType;

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    index: true,
  })
  entityStatus: EntityStatus;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

PersonSchema.index(
  { email: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { entityStatus: { $ne: EntityStatus.DELETED } },
  },
);
