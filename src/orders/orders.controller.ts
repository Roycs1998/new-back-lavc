import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { OrderDto } from './dto/order.dto';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear pedidos desde el carrito',
    description:
      'Crea uno o más pedidos (uno por evento presente en el carrito del usuario) y devuelve la lista de pedidos creados.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({
    type: [OrderDto],
    description: 'Pedidos creados correctamente',
  })
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<OrderDto[]> {
    return this.ordersService.createOrderFromCart(
      currentUser.id,
      createOrderDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos del usuario',
    description:
      'Devuelve los pedidos del usuario autenticado, ordenados del más reciente al más antiguo.',
  })
  @ApiOkResponse({
    type: [OrderDto],
    description: 'Pedidos obtenidos correctamente',
  })
  getUserOrders(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<OrderDto[]> {
    return this.ordersService.findUserOrders(currentUser.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un pedido',
    description:
      'Devuelve el detalle del pedido solicitado si pertenece al usuario autenticado.',
  })
  @ApiOkResponse({
    type: OrderDto,
    description: 'Pedido obtenido correctamente',
  })
  getOrder(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<OrderDto> {
    return this.ordersService.findOne(id, currentUser.id);
  }

  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Confirmar pedido pagado (solo administradores)',
    description:
      'Cambia el estado del pedido a **CONFIRMED**. Requiere que el pedido esté previamente en **PAID**.',
  })
  @ApiOkResponse({
    type: OrderDto,
    description: 'Pedido confirmado correctamente',
  })
  confirmOrder(@Param('id', ParseObjectIdPipe) id: string): Promise<OrderDto> {
    return this.ordersService.confirmOrder(id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar pedido',
    description:
      'Cancela el pedido (no aplica para pedidos confirmados o reembolsados).',
  })
  @ApiOkResponse({
    type: OrderDto,
    description: 'Pedido cancelado correctamente',
  })
  cancelOrder(@Param('id', ParseObjectIdPipe) id: string): Promise<OrderDto> {
    return this.ordersService.cancelOrder(id);
  }
}
