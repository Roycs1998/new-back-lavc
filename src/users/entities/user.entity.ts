import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';

export type UserDocument = User & Document & { _id: Types.ObjectId };

@Schema({
  collection: 'users',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  id: false,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      const r = ret as Record<string, any>;
      delete r.password;
      delete r.emailVerificationToken;
      delete r.passwordResetToken;
      delete r.passwordResetExpires;
      return r;
    },
  },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Person', required: true })
  personId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: false })
  companyId?: Types.ObjectId;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  entityStatus: EntityStatus;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('person', {
  ref: 'Person',
  localField: 'personId',
  foreignField: '_id',
  justOne: true,
});

UserSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { entityStatus: { $ne: EntityStatus.DELETED } },
  },
);

UserSchema.index({ personId: 1 });
UserSchema.index({ companyId: 1 });
UserSchema.index({ role: 1 });
