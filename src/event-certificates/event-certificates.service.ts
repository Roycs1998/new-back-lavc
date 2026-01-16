import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CertificateTemplate } from './entities/certificate-template.entity';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';
import { StorageService } from '../storage/storage.service';
import { Event, EventDocument } from '../events/entities/event.entity';
import {
  TicketType,
  TicketTypeDocument,
} from '../event-ticket-types/entities/ticket.entity';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';
import { EventParticipant } from '../events/entities/event-participant.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { toDto } from '../utils/toDto';
import { TicketLifecycleStatus } from '../common/enums/ticket-lifecycle-status.enum';
import { CertificateTemplateDto } from './dto/certificate-template.dto';

@Injectable()
export class EventCertificatesService {
  private readonly logger = new Logger(EventCertificatesService.name);

  constructor(
    @InjectModel(CertificateTemplate.name)
    private readonly certificateTemplateModel: Model<CertificateTemplate>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name)
    private readonly ticketTypeModel: Model<TicketTypeDocument>,
    @InjectModel(EventParticipant.name)
    private readonly eventParticipantModel: Model<EventParticipant>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createDto: CreateCertificateTemplateDto,
    file: Express.Multer.File,
  ) {
    // 1. Validar evento
    const event = await this.eventModel.findById(createDto.eventId);
    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    // 2. Validar tipos de tickets
    if (createDto.ticketTypeIds && createDto.ticketTypeIds.length > 0) {
      const ticketCount = await this.ticketTypeModel.countDocuments({
        _id: { $in: createDto.ticketTypeIds },
        eventId: createDto.eventId,
      });

      if (ticketCount !== createDto.ticketTypeIds.length) {
        throw new BadRequestException(
          'Uno o más tipos de tickets no pertenecen al evento',
        );
      }

      // 3. Verificar exclusividad: Un ticket type no puede tener más de un template activo
      const conflictingTemplates = await this.certificateTemplateModel.find({
        eventId: createDto.eventId,
        isActive: true,
        ticketTypeIds: { $in: createDto.ticketTypeIds },
      });

      if (conflictingTemplates.length > 0) {
        throw new ConflictException(
          'Uno o más tipos de tickets ya tienen un certificado asignado',
        );
      }
    }

    // 4. Subir archivo
    const uploadResult = await this.storageService.uploadCertificateTemplate(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // 5. Guardar template
    const template = new this.certificateTemplateModel({
      ...createDto,
      fileKey: uploadResult.key,
      fileUrl: uploadResult.url,
    });

    await template.save();
    await template.populate('ticketTypeIds', 'name');

    return toDto(template, CertificateTemplateDto);
  }

  async findAllByEvent(eventId: string) {
    const templates = await this.certificateTemplateModel
      .find({ eventId, isActive: true })
      .populate('ticketTypeIds', 'name')
      .sort({ createdAt: -1 });

    return templates.map((t) => toDto(t, CertificateTemplateDto));
  }

  async findOne(id: string) {
    const template = await this.certificateTemplateModel
      .findById(id)
      .populate('ticketTypeIds', 'name');

    if (!template || !template.isActive) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return toDto(template, CertificateTemplateDto);
  }

  async update(
    id: string,
    updateDto: UpdateCertificateTemplateDto,
    file?: Express.Multer.File,
  ) {
    const template = await this.certificateTemplateModel.findById(id);
    if (!template || !template.isActive) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Validar tickets si se actualizan
    if (updateDto.ticketTypeIds) {
      const ticketCount = await this.ticketTypeModel.countDocuments({
        _id: { $in: updateDto.ticketTypeIds },
        eventId: template.eventId,
      });

      if (ticketCount !== updateDto.ticketTypeIds.length) {
        throw new BadRequestException(
          'Uno o más tipos de tickets no pertenecen al evento',
        );
      }

      // Verificar conflictos (excluyendo el actual)
      const conflictingTemplates = await this.certificateTemplateModel.find({
        eventId: template.eventId,
        isActive: true,
        _id: { $ne: id },
        ticketTypeIds: { $in: updateDto.ticketTypeIds },
      });

      if (conflictingTemplates.length > 0) {
        throw new ConflictException(
          'Uno o más tipos de tickets ya tienen un certificado asignado en otra plantilla',
        );
      }
    }

    // Actualizar archivo si existe
    if (file) {
      // Eliminar anterior
      await this.storageService.deleteFile(template.fileKey);

      const uploadResult = await this.storageService.uploadCertificateTemplate(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      template.fileKey = uploadResult.key;
      template.fileUrl = uploadResult.url;
    }

    Object.assign(template, updateDto);
    await template.save();
    await template.populate('ticketTypeIds', 'name');
    return toDto(template, CertificateTemplateDto);
  }

  async remove(id: string) {
    const template = await this.certificateTemplateModel.findById(id);
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Soft delete
    template.isActive = false;
    await template.save();

    return { message: 'Plantilla eliminada correctamente' };
  }

  // --- Generación de Certificados ---

  async previewCertificate(templateId: string) {
    const template = await this.certificateTemplateModel.findById(templateId);
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const mockName = 'JUAN PÉREZ';
    return this.generatePdf(template, mockName);
  }

  async generateCertificateForUser(eventId: string, userId: string) {
    // 1. Verificar si el evento ha finalizado
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Evento no encontrado');

    const now = new Date();
    // TODO: Descomentar para producción si se requiere que el evento haya terminado
    /*
    if (event.endDate > now) {
      throw new BadRequestException('El evento aún no ha finalizado');
    }
    */

    // 2. Buscar ticket del usuario
    const ticket = await this.ticketModel.findOne({
      eventId,
      userId,
      status: TicketLifecycleStatus.ACTIVE,
    });

    if (!ticket) {
      throw new NotFoundException(
        'No se encontró un ticket válido para este usuario en el evento',
      );
    }

    // 3. Buscar template asociado al tipo de ticket
    const template = await this.certificateTemplateModel.findOne({
      eventId,
      isActive: true,
      ticketTypeIds: ticket.ticketTypeId,
    });

    if (!template) {
      throw new NotFoundException(
        'No hay certificado disponible para su tipo de entrada',
      );
    }

    // 4. Obtener nombre del participante
    const participantName =
      `${ticket.attendeeInfo.firstName} ${ticket.attendeeInfo.lastName}`.toUpperCase();

    // 5. Generar PDF
    return this.generatePdf(template, participantName);
  }

  private async generatePdf(
    template: CertificateTemplate,
    name: string,
  ): Promise<Buffer> {
    try {
      // Obtener el PDF base
      let pdfBuffer: Buffer;

      // Intentar obtener URL firmada si es privado
      const signedUrl = await this.storageService.getSignedUrl(
        template.fileKey,
      );

      const response = await axios.get(signedUrl, {
        responseType: 'arraybuffer',
      });
      pdfBuffer = Buffer.from(response.data);

      // Cargar PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Configurar fuente
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Calcular posición
      const { x, y, size, color } = template.fontConfig;

      // Convertir color hex a rgb
      const rgbColor = this.hexToRgb(color);

      // Dibujar texto
      // Nota: y es desde abajo-izquierda en pdf-lib
      // Si queremos que sea desde arriba-izquierda (como suele ser en UI web), debemos invertirlo: height - y
      // Asumiremos que el frontend envía coordenadas "desde arriba"
      const pageHeight = firstPage.getHeight();
      const pdfY = pageHeight - y;

      firstPage.drawText(name, {
        x: x,
        y: pdfY,
        size: size,
        font: font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
      });

      // Guardar
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error(
        `Error generando certificado: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Error al generar el certificado');
    }
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  }
}
