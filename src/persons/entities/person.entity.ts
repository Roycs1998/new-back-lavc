import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { PersonType } from 'src/common/enums/person-type.enum';

export type PersonDocument = Person & Document & { _id: Types.ObjectId };

@Schema({
  collection: 'persons',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  discriminatorKey: 'type',
  id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Person {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({
    type: String,
    enum: PersonType,
    required: true,
  })
  type: PersonType;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

PersonSchema.index(
  { email: 1 },
  {
    partialFilterExpression: { status: { $ne: EntityStatus.DELETED } },
  },
);

PersonSchema.index({ type: 1 });
