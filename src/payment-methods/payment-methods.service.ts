import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PaymentMethod,
  PaymentMethodDocument,
} from './entities/payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodFilterDto } from './dto/payment-method-filter.dto';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { toObjectId } from 'src/utils/toObjectId';

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);

  constructor(
    @InjectModel(PaymentMethod.name)
    private paymentMethodModel: Model<PaymentMethodDocument>,
  ) { }

  async create(
    createDto: CreatePaymentMethodDto,
    userId: string,
  ): Promise<PaymentMethodDocument> {
    try {
      const paymentMethod = new this.paymentMethodModel({
        ...createDto,
        companyId: createDto.companyId
          ? toObjectId(createDto.companyId)
          : undefined,
        createdBy: toObjectId(userId),
        updatedBy: toObjectId(userId),
      });

      await paymentMethod.save();
      this.logger.log(`Payment method created: ${paymentMethod._id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to create payment method: ${error.message}`);
      throw new BadRequestException('Failed to create payment method');
    }
  }

  async findAll(
    filter: PaymentMethodFilterDto,
  ): Promise<PaymentMethodDocument[]> {
    const query: any = { entityStatus: EntityStatus.ACTIVE };

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.companyId) {
      query.companyId = toObjectId(filter.companyId);
    }

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    if (filter.search) {
      query.$or = [
        { name: new RegExp(filter.search, 'i') },
        { description: new RegExp(filter.search, 'i') },
      ];
    }

    return this.paymentMethodModel
      .find(query)
      .populate('companyId', 'name')
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async getAvailablePaymentMethods(
    companyId?: string,
    eventId?: string,
  ): Promise<PaymentMethodDocument[]> {
    const query: any = {
      entityStatus: EntityStatus.ACTIVE,
      isActive: true,
    };

    // Si hay companyId, buscar métodos de esa empresa O globales
    if (companyId) {
      query.$or = [{ companyId: null }, { companyId: toObjectId(companyId) }];
    } else {
      // Si no hay companyId, solo mostrar globales
      query.companyId = null;
    }

    const methods = await this.paymentMethodModel
      .find(query)
      .select('+culqiConfig')
      .sort({ displayOrder: 1 })
      .exec();

    // ⭐ FALLBACK: Si no hay métodos para la empresa, retornar métodos globales
    if (methods.length === 0 && companyId) {
      this.logger.log(`No payment methods found for company ${companyId}, returning global methods`);

      return this.paymentMethodModel
        .find({
          entityStatus: EntityStatus.ACTIVE,
          isActive: true,
          companyId: null, // Solo globales
        })
        .select('+culqiConfig')
        .sort({ displayOrder: 1 })
        .exec();
    }

    return methods;
  }

  async findOne(id: string): Promise<PaymentMethodDocument> {
    const paymentMethod = await this.paymentMethodModel
      .findOne({
        _id: toObjectId(id),
        entityStatus: EntityStatus.ACTIVE,
      })
      .populate('companyId', 'name')
      .exec();

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return paymentMethod;
  }

  async findOneWithSecrets(id: string): Promise<PaymentMethodDocument> {
    const paymentMethod = await this.paymentMethodModel
      .findOne({
        _id: toObjectId(id),
        entityStatus: EntityStatus.ACTIVE,
      })
      .select('+culqiConfig')
      .exec();

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return paymentMethod;
  }

  async update(
    id: string,
    updateDto: UpdatePaymentMethodDto,
    userId: string,
  ): Promise<PaymentMethodDocument> {
    const paymentMethod = await this.findOne(id);

    Object.assign(paymentMethod, {
      ...updateDto,
      companyId: updateDto.companyId
        ? toObjectId(updateDto.companyId)
        : paymentMethod.companyId,
      updatedBy: toObjectId(userId),
    });

    await paymentMethod.save();
    this.logger.log(`Payment method updated: ${id}`);
    return paymentMethod;
  }

  async softDelete(id: string, userId: string): Promise<{ deleted: boolean }> {
    const paymentMethod = await this.findOne(id);

    paymentMethod.entityStatus = EntityStatus.DELETED;
    paymentMethod.deletedAt = new Date();
    paymentMethod.deletedBy = toObjectId(userId);

    await paymentMethod.save();
    this.logger.log(`Payment method soft deleted: ${id}`);

    return { deleted: true };
  }

  async toggleActive(id: string): Promise<PaymentMethodDocument> {
    const paymentMethod = await this.findOne(id);
    paymentMethod.isActive = !paymentMethod.isActive;
    await paymentMethod.save();

    this.logger.log(
      `Payment method ${paymentMethod.isActive ? 'activated' : 'deactivated'
      }: ${id}`,
    );
    return paymentMethod;
  }
}
