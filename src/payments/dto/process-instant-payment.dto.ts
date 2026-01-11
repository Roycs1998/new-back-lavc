import {
    IsObject,
    IsMongoId,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    CustomerInfoDto,
    BillingInfoDto,
} from './create-payment.dto';

export class ProcessInstantPaymentDto {
    @ApiProperty({
        description: 'Información del cliente',
        type: CustomerInfoDto,
    })
    @ValidateNested()
    @Type(() => CustomerInfoDto)
    customerInfo: CustomerInfoDto;

    @ApiPropertyOptional({
        description: 'Información de facturación (opcional)',
        type: BillingInfoDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => BillingInfoDto)
    billingInfo?: BillingInfoDto;

    @ApiProperty({
        description: 'ID del método de pago (debe tener autoConfirm: true)',
        example: '677fb4c8b5cc8af5e84a0001',
    })
    @IsMongoId()
    paymentMethodId: string;

    @ApiProperty({
        description: 'Datos específicos del pago (ej: token de Culqi)',
        example: { token: 'tkn_test_xxxxxxxxxxxxx' },
    })
    @IsObject()
    paymentData: any;
}
