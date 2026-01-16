import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CertificateTemplateDocument = CertificateTemplate & Document;

@Schema({ _id: false })
export class FontConfig {
  @Prop({ type: Number, required: true })
  x!: number;

  @Prop({ type: Number, required: true })
  y!: number;

  @Prop({ type: Number, required: true })
  size!: number;

  @Prop({ type: String, required: true })
  color!: string; // Hex color e.g., "#000000"

  @Prop({ type: String, default: 'Helvetica' })
  fontFamily!: string;
}

const FontConfigSchema = SchemaFactory.createForClass(FontConfig);

@Schema({
  collection: 'certificate_templates',
  versionKey: false,
  timestamps: true,
  id: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class CertificateTemplate {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  // Lista de TicketTypes que usarán este template.
  // Un TicketType solo puede estar en UN template activo por evento.
  @Prop({ type: [{ type: Types.ObjectId, ref: 'TicketType' }], default: [] })
  ticketTypeIds!: Types.ObjectId[];

  @Prop({ type: String, required: true })
  fileKey!: string; // Ruta en S3 del PDF base

  @Prop({ type: String, required: true })
  fileUrl!: string; // URL del PDF base (privada o firmada)

  @Prop({ type: FontConfigSchema, required: true })
  fontConfig!: FontConfig;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const CertificateTemplateSchema =
  SchemaFactory.createForClass(CertificateTemplate);

CertificateTemplateSchema.index({ eventId: 1, isActive: 1 });
