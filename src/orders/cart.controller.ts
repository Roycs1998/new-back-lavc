import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CartItemDto } from './dto/cart-item.dto';
import { CartSummaryDto } from './dto/cart-summary.dto';
import { UpdateCartItemQuantityDto } from './dto/update-cart-item-quantity.dto';

@ApiTags('Carrito de la compra')
@Controller('cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('events/:eventId/add')
  @ApiOperation({
    summary: 'Agregar ticket al carrito',
    description:
      'Agrega un tipo de ticket al carrito del usuario y retorna el carrito actualizado.',
  })
  @ApiBody({ type: AddToCartDto })
  @ApiOkResponse({
    type: [CartItemDto],
    description: 'Carrito actualizado correctamente',
  })
  addToCart(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.cartService.addToCart(currentUser.id, eventId, addToCartDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener el carrito del usuario',
    description:
      'Retorna los ítems actuales del carrito con detalles de evento y tipo de ticket.',
  })
  @ApiOkResponse({
    type: [CartItemDto],
    description: 'Carrito obtenido correctamente',
  })
  getCart(@CurrentUser() currentUser: CurrentUserData): Promise<CartItemDto[]> {
    return this.cartService.getCart(currentUser.id);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Obtener resumen del carrito',
    description:
      'Devuelve totales del carrito (subtotal, impuestos, cargos y total), además del número de eventos involucrados.',
  })
  @ApiOkResponse({
    type: CartSummaryDto,
    description: 'Resumen del carrito obtenido correctamente',
  })
  getCartSummary(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<CartSummaryDto> {
    return this.cartService.getCartSummary(currentUser.id);
  }

  @Patch('items/:cartItemId')
  @ApiOperation({
    summary: 'Actualizar cantidad de un ítem del carrito',
    description:
      'Actualiza la cantidad del ítem. Si la cantidad es 0, el ítem se elimina. Retorna el carrito actualizado.',
  })
  @ApiBody({ type: UpdateCartItemQuantityDto })
  @ApiOkResponse({
    type: [CartItemDto],
    description: 'Carrito actualizado correctamente',
  })
  updateCartItem(
    @Param('cartItemId', ParseObjectIdPipe) cartItemId: string,
    @Body() body: UpdateCartItemQuantityDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.cartService.updateCartItem(
      currentUser.id,
      cartItemId,
      body.quantity,
    );
  }

  @Delete('items/:cartItemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiOperation({
    summary: 'Eliminar ítem del carrito',
    description: 'Elimina el ítem indicado y retorna el carrito actualizado.',
  })
  @ApiOkResponse({
    type: [CartItemDto],
    description: 'Ítem eliminado y carrito actualizado',
  })
  removeFromCart(
    @Param('cartItemId', ParseObjectIdPipe) cartItemId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.cartService.removeFromCart(currentUser.id, cartItemId);
  }

  @Delete('clear')
  @ApiOperation({
    summary: 'Vaciar carrito',
    description: 'Elimina todos los ítems del carrito del usuario.',
  })
  @ApiCreatedResponse({
    description: 'Carrito vaciado correctamente',
  })
  clearCart(@CurrentUser() currentUser: CurrentUserData) {
    return this.cartService.clearCart(currentUser.id);
  }
}
