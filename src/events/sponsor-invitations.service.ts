import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SponsorInvitation,
  SponsorInvitationDocument,
} from './entities/sponsor-invitation.entity';
import { CreateSponsorInvitationDto } from './dto/create-sponsor-invitation.dto';
import { UpdateSponsorInvitationDto } from './dto/update-sponsor-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AcceptInvitationForUserDto } from './dto/accept-invitation-for-user.dto';
import { SponsorInvitationDto } from './dto/sponsor-invitation.dto';
import { CreateBulkInvitationsDto } from './dto/create-bulk-invitations.dto';
import { BulkInvitationsResponseDto } from './dto/bulk-invitations-response.dto';
import { InvitationUsageType } from '../common/enums/invitation-usage-type.enum';
import { ParticipantType } from '../common/enums/participant-type.enum';
import { EventSponsorsService } from './event-sponsors.service';
import { EventParticipantsService } from './event-participants.service';
import { UsersService } from '../users/users.service';
import { PersonsService } from '../persons/persons.service';
import { toDto } from '../utils/toDto';
import { TicketType, TicketTypeDocument } from './entities/ticket.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { TicketsService } from '../tickets/tickets.service';
import { Event, EventDocument } from './entities/event.entity';
import { EventSponsorDocument } from './entities/event-sponsor.entity';

@Injectable()
export class SponsorInvitationsService {
  constructor(
    @InjectModel(SponsorInvitation.name)
    private invitationModel: Model<SponsorInvitationDocument>,
    @InjectModel(TicketType.name)
    private ticketTypeModel: Model<TicketTypeDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    private eventSponsorsService: EventSponsorsService,
    @Inject(forwardRef(() => EventParticipantsService))
    private eventParticipantsService: EventParticipantsService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => PersonsService))
    private personsService: PersonsService,
    @Inject(forwardRef(() => TicketsService))
    private ticketsService: TicketsService,
  ) {}

  private async generateUniqueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: boolean = true;

    while (exists) {
      code = Array.from({ length: 8 }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
      ).join('');

      const found = await this.invitationModel.exists({ code });
      exists = found !== null;
    }

    return code!;
  }

  private async findBestTicketTypeForInvitation(
    eventId: string,
    participantType: ParticipantType,
  ): Promise<string> {
    const tickets = await this.ticketTypeModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .exec();

    if (!tickets || tickets.length === 0) {
      throw new NotFoundException(
        'No hay tipos de tickets disponibles para este evento',
      );
    }

    // 1. Intentar buscar por targetRole (Nuevo sistema de tickets exclusivos)
    const systemTicket = tickets.find((t) => t.targetRole === participantType);
    if (systemTicket) {
      return (systemTicket._id as Types.ObjectId).toString();
    }

    // Fallback: Lógica antigua para compatibilidad o eventos antiguos
    // 2. Si es una beca (SCHOLARSHIP), buscar cualquier ticket pagado (precio > 0)
    //    pero seleccionando el más barato de ellos.
    if (participantType === ParticipantType.SCHOLARSHIP) {
      const paidTickets = tickets
        .filter((t) => t.price > 0)
        .sort((a, b) => a.price - b.price);

      if (paidTickets.length > 0) {
        return (paidTickets[0]._id as Types.ObjectId).toString();
      }
      // Si no hay tickets pagados, seguirá al flujo normal y tomará uno gratuito si existe
    }

    // 3. Buscar tickets gratuitos (precio 0)
    const freeTickets = tickets.filter((t) => t.price === 0);

    if (freeTickets.length > 0) {
      // 4. Intentar coincidir por nombre según el tipo de participante
      let regex: RegExp | null = null;

      if (
        participantType === ParticipantType.STAFF ||
        participantType === ParticipantType.OPERATIONAL_STAFF
      ) {
        regex = /staff|organizador|equipo|operativo/i;
      } else if (participantType === ParticipantType.GUEST) {
        regex = /invitado|guest|cortesía|vip/i;
      } else if (participantType === ParticipantType.SCHOLARSHIP) {
        regex = /beca|scholarship|estudiante/i;
      }

      if (regex) {
        const matched = freeTickets.find((t) => regex!.test(t.name));
        if (matched) return (matched._id as Types.ObjectId).toString();
      }

      // 5. Si no hay coincidencia específica, devolver el primer gratuito
      return (freeTickets[0]._id as Types.ObjectId).toString();
    }

    // 6. Si no hay gratuitos, devolver el más barato
    const cheapestTicket = tickets.sort((a, b) => a.price - b.price)[0];
    return (cheapestTicket._id as Types.ObjectId).toString();
  }

  async createInvitation(
    eventSponsorId: string,
    createDto: CreateSponsorInvitationDto,
    createdBy: string,
  ): Promise<SponsorInvitationDto> {
    let sponsor: any = null;
    let eventId: Types.ObjectId;
    let sponsorIdToSave: Types.ObjectId | null = null;

    if (createDto.participantType === ParticipantType.OPERATIONAL_STAFF) {
      // Para OPERATIONAL_STAFF, eventSponsorId es el eventId
      eventId = new Types.ObjectId(eventSponsorId);

      const event = await this.eventModel.findById(eventId);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }

      // Guardar el companyId del evento como eventSponsorId
      sponsorIdToSave = event.companyId;
    } else {
      // Para otros tipos, requiere sponsor
      sponsor = await this.eventSponsorsService.findBySponsorId(eventSponsorId);

      if (!sponsor) {
        throw new NotFoundException('Sponsor not found');
      }

      if (!sponsor.isActive) {
        throw new BadRequestException('Sponsor is not active');
      }

      eventId = sponsor.eventId;
      sponsorIdToSave = new Types.ObjectId(eventSponsorId);

      const availableQuota = this.getAvailableQuota(
        sponsor,
        createDto.participantType,
      );

      if (availableQuota === 0) {
        throw new BadRequestException(
          `No hay cuota disponible para ${createDto.participantType}`,
        );
      }

      if (
        createDto.usageType === InvitationUsageType.MULTIPLE &&
        createDto.maxUses
      ) {
        if (createDto.maxUses > availableQuota) {
          throw new BadRequestException(
            `Solo hay ${availableQuota} espacios disponibles, no se pueden crear ${createDto.maxUses} usos`,
          );
        }
      }
    }

    // Vincular siempre un ticket a la invitación
    let ticketTypeId: string | null = createDto.ticketTypeId || null;

    if (!ticketTypeId) {
      // Buscar el mejor ticket disponible (incluyendo tickets de sistema por rol)
      ticketTypeId = await this.findBestTicketTypeForInvitation(
        eventId.toString(),
        createDto.participantType,
      );
    } else {
      // Validar que el ticket existe y pertenece al evento
      const ticketExists = await this.ticketTypeModel.exists({
        _id: new Types.ObjectId(ticketTypeId),
        eventId: eventId,
      });

      if (!ticketExists) {
        throw new BadRequestException(
          'El ticket especificado no pertenece a este evento',
        );
      }
    }

    const code = await this.generateUniqueCode();

    const invitation = new this.invitationModel({
      eventSponsorId: sponsorIdToSave,
      eventId: eventId,
      code,
      participantType: createDto.participantType,
      ticketTypeId: new Types.ObjectId(ticketTypeId), // Siempre habrá un ticket
      usageType: createDto.usageType,
      maxUses:
        createDto.usageType === InvitationUsageType.MULTIPLE
          ? createDto.maxUses
          : null,
      currentUses: 0,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      isActive: true,
      createdBy: new Types.ObjectId(createdBy),
      uses: [],
    });

    const saved = await invitation.save();
    const populated = await this.invitationModel
      .findById(saved._id)
      .populate('ticketType')
      .exec();

    return toDto(populated!, SponsorInvitationDto);
  }

  async createBulkInvitations(
    eventSponsorId: string,
    createDto: CreateBulkInvitationsDto,
    createdBy: string,
  ): Promise<BulkInvitationsResponseDto> {
    let sponsor: EventSponsorDocument | null = null;
    let eventId: Types.ObjectId;
    let sponsorIdToSave: Types.ObjectId | null = null;

    if (createDto.participantType === ParticipantType.OPERATIONAL_STAFF) {
      eventId = new Types.ObjectId(eventSponsorId);

      const event = await this.eventModel.findById(eventId);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }

      sponsorIdToSave = event.companyId;
    } else {
      sponsor = await this.eventSponsorsService.findBySponsorId(eventSponsorId);

      if (!sponsor) {
        throw new NotFoundException('Sponsor not found');
      }

      if (!sponsor.isActive) {
        throw new BadRequestException('Sponsor is not active');
      }

      eventId = sponsor.eventId;
      sponsorIdToSave = new Types.ObjectId(eventSponsorId);

      const availableQuota = this.getAvailableQuota(
        sponsor,
        createDto.participantType,
      );

      if (availableQuota < createDto.quantity) {
        throw new BadRequestException(
          `Solo hay ${availableQuota} espacios disponibles, no se pueden crear ${createDto.quantity} invitaciones`,
        );
      }
    }

    let ticketTypeId: string | null = createDto.ticketTypeId || null;

    if (!ticketTypeId) {
      ticketTypeId = await this.findBestTicketTypeForInvitation(
        eventId.toString(),
        createDto.participantType,
      );
    } else {
      const ticketExists = await this.ticketTypeModel.exists({
        _id: new Types.ObjectId(ticketTypeId),
        eventId: eventId,
      });

      if (!ticketExists) {
        throw new BadRequestException(
          'El ticket especificado no pertenece a este evento',
        );
      }
    }

    const codes = await Promise.all(
      Array.from({ length: createDto.quantity }, () =>
        this.generateUniqueCode(),
      ),
    );

    const invitationsToCreate = codes.map((code) => ({
      eventSponsorId: sponsorIdToSave,
      eventId: eventId,
      code,
      participantType: createDto.participantType,
      ticketTypeId: new Types.ObjectId(ticketTypeId!),
      usageType: InvitationUsageType.SINGLE,
      maxUses: null,
      currentUses: 0,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      isActive: true,
      createdBy: new Types.ObjectId(createdBy),
      uses: [],
    }));

    const created = await this.invitationModel.insertMany(invitationsToCreate);

    const populatedInvitations = await this.invitationModel
      .find({ _id: { $in: created.map((inv) => inv._id) } })
      .populate('ticketType')
      .exec();

    const remainingQuota =
      createDto.participantType !== ParticipantType.OPERATIONAL_STAFF && sponsor
        ? this.getAvailableQuota(sponsor, createDto.participantType) -
          createDto.quantity
        : 0;

    const totalQuota =
      createDto.participantType !== ParticipantType.OPERATIONAL_STAFF && sponsor
        ? this.getAvailableQuota(sponsor, createDto.participantType)
        : 0;

    return {
      success: true,
      created: created.length,
      invitations: populatedInvitations.map((inv) =>
        toDto(inv, SponsorInvitationDto),
      ),
      limits: {
        remaining: remainingQuota,
        total: totalQuota + createDto.quantity,
      },
    };
  }

  private getAvailableQuota(
    sponsor: any,
    participantType: ParticipantType,
  ): number {
    switch (participantType) {
      case ParticipantType.STAFF:
        return sponsor.staffQuota - sponsor.staffUsed;
      case ParticipantType.GUEST:
        return sponsor.guestQuota - sponsor.guestUsed;
      case ParticipantType.SCHOLARSHIP:
        return sponsor.scholarshipQuota - sponsor.scholarshipUsed;
      default:
        return 0;
    }
  }

  async getInvitationsByEventSponsor(
    eventSponsorId: string,
  ): Promise<SponsorInvitationDto[]> {
    const invitations = await this.invitationModel
      .find({ eventSponsorId: new Types.ObjectId(eventSponsorId) })
      .populate('ticketType')
      .sort({ createdAt: -1 })
      .exec();

    return invitations.map((inv) => toDto(inv, SponsorInvitationDto));
  }

  async getInvitationsByEvent(
    eventId: string,
  ): Promise<SponsorInvitationDto[]> {
    const invitations = await this.invitationModel
      .find({
        eventId: new Types.ObjectId(eventId),
        participantType: ParticipantType.OPERATIONAL_STAFF,
      })
      .populate('ticketType')
      .sort({ createdAt: -1 })
      .exec();

    return invitations.map((inv) => toDto(inv, SponsorInvitationDto));
  }

  async getAllInvitationsForEvent(
    eventId: string,
    filters?: {
      sponsorId?: string;
      participantType?: ParticipantType;
      usageType?: InvitationUsageType;
      isActive?: number;
      hasAvailableUses?: number;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    userCompanyId?: string,
  ): Promise<{
    data: SponsorInvitationDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const query: any = {
      eventId: new Types.ObjectId(eventId),
    };

    if (userCompanyId) {
      const companySponsors =
        await this.eventSponsorsService.findByCompanyId(userCompanyId);
      const sponsorIds = companySponsors.map((s: any) => s._id);

      query.eventSponsorId = { $in: sponsorIds };
    } else if (filters?.sponsorId) {
      query.eventSponsorId = new Types.ObjectId(filters.sponsorId);
    }

    if (filters?.participantType) {
      query.participantType = filters.participantType;
    }

    if (filters?.usageType) {
      query.usageType = filters.usageType;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive === 1;
    }

    const total = await this.invitationModel.countDocuments(query);

    // Calcular skip
    const skip = (page - 1) * limit;

    // Construir sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query con paginación
    const invitations = await this.invitationModel
      .find(query)
      .populate('ticketType')
      .populate({
        path: 'eventSponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'uses',
        populate: { path: 'userId', populate: { path: 'person' } },
      })
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .exec();

    let filteredInvitations = invitations;

    if (filters?.hasAvailableUses !== undefined) {
      filteredInvitations = invitations.filter((inv) => {
        if (filters.hasAvailableUses === 1) {
          if (inv.usageType === InvitationUsageType.SINGLE) {
            return inv.currentUses === 0;
          } else {
            return inv.maxUses === null || inv.currentUses < (inv.maxUses || 0);
          }
        } else {
          if (inv.usageType === InvitationUsageType.SINGLE) {
            return inv.currentUses >= 1;
          } else {
            return (
              inv.maxUses !== null && inv.currentUses >= (inv.maxUses || 0)
            );
          }
        }
      });
    }

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: filteredInvitations.map((inv) => toDto(inv, SponsorInvitationDto)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async getInvitationDetails(
    invitationId: string,
  ): Promise<SponsorInvitationDto> {
    const invitation = await this.invitationModel
      .findById(new Types.ObjectId(invitationId))
      .populate('ticketType')
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return toDto(invitation, SponsorInvitationDto);
  }

  async updateInvitation(
    invitationId: string,
    updateDto: UpdateSponsorInvitationDto,
  ): Promise<SponsorInvitationDto> {
    const invitation = await this.invitationModel.findById(
      new Types.ObjectId(invitationId),
    );

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (updateDto.maxUses !== undefined) {
      if (updateDto.maxUses < invitation.currentUses) {
        throw new BadRequestException(
          `No se puede reducir maxUses a ${updateDto.maxUses}, ya se han usado ${invitation.currentUses}`,
        );
      }
      invitation.maxUses = updateDto.maxUses;
    }

    if (updateDto.expiresAt !== undefined) {
      invitation.expiresAt = updateDto.expiresAt
        ? new Date(updateDto.expiresAt)
        : null;
    }

    if (updateDto.isActive !== undefined) {
      invitation.isActive = updateDto.isActive;
    }

    if (updateDto.ticketTypeId) {
      const sponsor = await this.eventSponsorsService.findBySponsorId(
        invitation.eventSponsorId.toString(),
      );

      const ticketExists = await this.ticketTypeModel.exists({
        _id: new Types.ObjectId(updateDto.ticketTypeId),
        eventId: sponsor!.eventId,
      });

      if (!ticketExists) {
        throw new BadRequestException(
          'El ticket especificado no pertenece a este evento',
        );
      }

      invitation.ticketTypeId = new Types.ObjectId(updateDto.ticketTypeId);
    }

    const saved = await invitation.save();
    const populated = await this.invitationModel
      .findById(saved._id)
      .populate('ticketType')
      .exec();

    return toDto(populated!, SponsorInvitationDto);
  }

  async deactivateInvitation(
    invitationId: string,
  ): Promise<SponsorInvitationDto> {
    const invitation = await this.invitationModel.findById(
      new Types.ObjectId(invitationId),
    );

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.isActive = false;
    const saved = await invitation.save();
    const populated = await this.invitationModel
      .findById(saved._id)
      .populate('ticketType')
      .exec();

    return toDto(populated!, SponsorInvitationDto);
  }

  async validateInvitationByCode(code: string): Promise<any> {
    const invitation = await this.invitationModel
      .findOne({ code: code.toUpperCase() })
      .populate('ticketType')
      .populate({
        path: 'eventSponsor',
        populate: { path: 'company' },
      })
      .populate('event')
      .exec();

    if (!invitation) {
      throw new NotFoundException('Código de invitación no válido');
    }

    const validation = {
      valid: true,
      errors: [] as string[],
    };

    if (!invitation.isActive) {
      validation.valid = false;
      validation.errors.push('La invitación está inactiva');
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      validation.valid = false;
      validation.errors.push('La invitación ha expirado');
    }

    if (
      invitation.usageType === InvitationUsageType.SINGLE &&
      invitation.currentUses >= 1
    ) {
      validation.valid = false;
      validation.errors.push('Esta invitación ya fue utilizada');
    }

    if (
      invitation.usageType === InvitationUsageType.MULTIPLE &&
      invitation.maxUses &&
      invitation.currentUses >= invitation.maxUses
    ) {
      validation.valid = false;
      validation.errors.push('La invitación no tiene usos disponibles');
    }

    // Solo validar cuota si NO es OPERATIONAL_STAFF
    if (invitation.participantType !== ParticipantType.OPERATIONAL_STAFF) {
      const sponsor = await this.eventSponsorsService.findBySponsorId(
        invitation.eventSponsorId.toString(),
      );

      const availableQuota = this.getAvailableQuota(
        sponsor!,
        invitation.participantType,
      );

      if (availableQuota === 0) {
        validation.valid = false;
        validation.errors.push(
          'No hay cuota disponible para este tipo de participante',
        );
      }
    }

    return {
      ...validation,
      invitation: validation.valid
        ? toDto(invitation, SponsorInvitationDto)
        : null,
    };
  }

  async acceptInvitationWithAuth(code: string, userId: string): Promise<any> {
    const invitation = await this.invitationModel.findOne({
      code: code.toUpperCase(),
    });

    if (!invitation) {
      throw new NotFoundException('Código de invitación no válido');
    }

    this.validateInvitationStatus(invitation);

    if (invitation.participantType !== ParticipantType.OPERATIONAL_STAFF) {
      const hasQuota = await this.eventSponsorsService.checkQuotaAvailability(
        invitation.eventSponsorId.toString(),
        invitation.participantType,
      );

      if (!hasQuota) {
        throw new BadRequestException(
          'No hay cuota disponible para este tipo de participante',
        );
      }
    }

    const existing =
      await this.eventParticipantsService.getParticipantByUserAndEvent(
        userId,
        invitation.eventId.toString(),
      );

    if (existing) {
      throw new ConflictException('Ya estás registrado en este evento');
    }

    const participant = await this.eventParticipantsService.registerParticipant(
      invitation.eventId.toString(),
      {
        userId,
        eventSponsorId: invitation.eventSponsorId.toString(),
        participantType: invitation.participantType,
      },
    );

    let ticket: any = null;
    let ticketTypeId = invitation.ticketTypeId;

    if (!ticketTypeId) {
      try {
        const cheapestId = await this.findBestTicketTypeForInvitation(
          invitation.eventId.toString(),
          invitation.participantType,
        );
        ticketTypeId = new Types.ObjectId(cheapestId);
      } catch (error) {
        console.warn(
          'No se pudo encontrar un tipo de ticket para la invitación',
          error,
        );
      }
    }

    if (ticketTypeId) {
      ticket = await this.ticketsService.generateTicketForInvitation({
        userId,
        eventId: invitation.eventId.toString(),
        ticketTypeId: ticketTypeId.toString(),
        participantId: participant.id,
        participantType: invitation.participantType,
      });

      await this.eventParticipantsService.updateParticipantTicket(
        participant.id,
        ticket._id.toString(),
      );
    }

    // Actualizar invitación
    await this.updateInvitationUsage(invitation, userId, participant.id);

    return {
      success: true,
      participant,
      ticket: ticket
        ? {
            ticketNumber: ticket.ticketNumber,
            ticketType: ticket.ticketTypeName,
          }
        : null,
      message: '¡Bienvenido al evento! Tu registro ha sido confirmado.',
    };
  }

  async acceptInvitationWithSignup(
    code: string,
    acceptDto: AcceptInvitationDto,
  ): Promise<any> {
    const invitation = await this.invitationModel.findOne({
      code: code.toUpperCase(),
    });

    if (!invitation) {
      throw new NotFoundException('Código de invitación no válido');
    }

    this.validateInvitationStatus(invitation);

    // Solo validar cuota si NO es OPERATIONAL_STAFF
    if (invitation.participantType !== ParticipantType.OPERATIONAL_STAFF) {
      const hasQuota = await this.eventSponsorsService.checkQuotaAvailability(
        invitation.eventSponsorId.toString(),
        invitation.participantType,
      );

      if (!hasQuota) {
        throw new BadRequestException(
          'No hay cuota disponible para este tipo de participante',
        );
      }
    }

    // Crear nuevo usuario
    const newUser = await this.usersService.createUserWithPerson({
      firstName: acceptDto.firstName!,
      lastName: acceptDto.lastName!,
      email: acceptDto.email!,
      password: acceptDto.password!,
      phone: acceptDto.phone,
      roles: [UserRole.USER],
    });

    const userId = newUser.id;

    // Verificar que el usuario no esté ya registrado (por si acaso)
    const existing =
      await this.eventParticipantsService.getParticipantByUserAndEvent(
        userId,
        invitation.eventId.toString(),
      );

    if (existing) {
      throw new ConflictException('Ya estás registrado en este evento');
    }

    // Registrar participante
    const participant = await this.eventParticipantsService.registerParticipant(
      invitation.eventId.toString(),
      {
        userId,
        eventSponsorId: invitation.eventSponsorId.toString(),
        participantType: invitation.participantType,
      },
    );

    // Generar ticket para todos
    let ticket: any = null;
    let ticketTypeId = invitation.ticketTypeId;

    if (!ticketTypeId) {
      try {
        const cheapestId = await this.findBestTicketTypeForInvitation(
          invitation.eventId.toString(),
          invitation.participantType,
        );
        ticketTypeId = new Types.ObjectId(cheapestId);
      } catch (error) {
        console.warn(
          'No se pudo encontrar un tipo de ticket para la invitación',
          error,
        );
      }
    }

    if (ticketTypeId) {
      ticket = await this.ticketsService.generateTicketForInvitation({
        userId,
        eventId: invitation.eventId.toString(),
        ticketTypeId: ticketTypeId.toString(),
        participantId: participant.id,
        participantType: invitation.participantType,
      });

      // Actualizar participante con ticketId
      await this.eventParticipantsService.updateParticipantTicket(
        participant.id,
        ticket._id.toString(),
      );
    }

    // Actualizar invitación
    await this.updateInvitationUsage(invitation, userId, participant.id);

    return {
      success: true,
      participant,
      ticket: ticket
        ? {
            ticketNumber: ticket.ticketNumber,
            ticketType: ticket.ticketTypeName,
          }
        : null,
      userId: userId,
      message:
        '¡Bienvenido al evento! Tu cuenta ha sido creada y tu registro confirmado.',
    };
  }

  private validateInvitationStatus(
    invitation: SponsorInvitationDocument,
  ): void {
    if (!invitation.isActive) {
      throw new BadRequestException('La invitación está inactiva');
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      throw new BadRequestException('La invitación ha expirado');
    }

    if (
      invitation.usageType === InvitationUsageType.SINGLE &&
      invitation.currentUses >= 1
    ) {
      throw new BadRequestException('Esta invitación ya fue utilizada');
    }

    if (
      invitation.usageType === InvitationUsageType.MULTIPLE &&
      invitation.maxUses &&
      invitation.currentUses >= invitation.maxUses
    ) {
      throw new BadRequestException('La invitación no tiene usos disponibles');
    }
  }

  private async updateInvitationUsage(
    invitation: SponsorInvitationDocument,
    userId: string,
    participantId: string,
  ): Promise<void> {
    invitation.currentUses += 1;
    invitation.uses.push({
      userId: new Types.ObjectId(userId),
      participantId: new Types.ObjectId(participantId),
      usedAt: new Date(),
    });

    if (invitation.usageType === InvitationUsageType.SINGLE) {
      invitation.isActive = false;
    }

    await invitation.save();
  }

  async acceptInvitationForUser(
    code: string,
    acceptDto: AcceptInvitationForUserDto,
  ): Promise<{
    user: { id: string; email: string; fullName: string };
    message: string;
  }> {
    const user = await this.usersService.findOne(acceptDto.userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.acceptInvitationWithAuth(code, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.person?.fullName ?? '',
      },
      message: 'Usuario registrado en el evento exitosamente',
    };
  }
}
