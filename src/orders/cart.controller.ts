import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('Shopping Cart')
@Controller('cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('events/:eventId/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add ticket to cart' })
  @ApiResponse({ status: 200, description: 'Item added to cart successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient tickets',
  })
  addToCart(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.cartService.addToCart(currentUser.id, eventId, addToCartDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  getCart(@CurrentUser() currentUser: CurrentUserData) {
    return this.cartService.getCart(currentUser.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get cart summary with totals' })
  @ApiResponse({
    status: 200,
    description: 'Cart summary retrieved successfully',
  })
  getCartSummary(@CurrentUser() currentUser: CurrentUserData) {
    return this.cartService.getCartSummary(currentUser.id);
  }

  @Patch('items/:cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  updateCartItem(
    @Param('cartItemId', ParseObjectIdPipe) cartItemId: string,
    @Body('quantity') quantity: number,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.cartService.updateCartItem(
      currentUser.id,
      cartItemId,
      quantity,
    );
  }

  @Delete('items/:cartItemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  removeFromCart(
    @Param('cartItemId', ParseObjectIdPipe) cartItemId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.cartService.removeFromCart(currentUser.id, cartItemId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
  clearCart(@CurrentUser() currentUser: CurrentUserData) {
    return this.cartService.clearCart(currentUser.id);
  }
}
