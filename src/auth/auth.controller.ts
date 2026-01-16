import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterWithCompanyDto } from './dto/register-with-company.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Inicio de sesión de usuario',
    description:
      'Permite a un usuario autenticarse con su correo y contraseña. Retorna un token JWT junto con la información básica del usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    type: AuthResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registro de usuario',
    description:
      'Permite registrar un nuevo usuario con sus datos personales. El usuario queda autenticado automáticamente y recibe un token JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('register-with-company')
  @ApiOperation({
    summary: 'Registro de usuario con empresa propia',
    description:
      'Registra un nuevo usuario junto con la creación de su propia empresa. El usuario queda autenticado automáticamente y recibe rol de COMPANY_ADMIN asociado a la empresa creada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario y empresa registrados exitosamente',
    type: AuthResponseDto,
  })
  async registerWithCompany(
    @Body() dto: RegisterWithCompanyDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerWithCompany(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Devuelve los datos del usuario actualmente autenticado usando el token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido correctamente',
    type: UserDto,
  })
  async getProfile(@CurrentUser() user: CurrentUserData): Promise<UserDto> {
    return this.authService.getProfile(user.id);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Refrescar token JWT',
    description:
      'Genera un nuevo token de acceso (JWT) a partir de un usuario autenticado con sesión activa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado correctamente',
    type: RefreshTokenResponseDto,
  })
  async refreshToken(
    @CurrentUser() user: CurrentUserData,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description:
      'Permite a un usuario autenticado cambiar su contraseña actual por una nueva.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada correctamente',
    type: MessageResponseDto,
  })
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitud de restablecimiento de contraseña',
    description:
      'Genera un token para restablecer la contraseña y lo envía al correo del usuario (si existe en el sistema).',
  })
  @ApiResponse({
    status: 200,
    description: 'Se generó el enlace de restablecimiento',
    type: MessageResponseDto,
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Permite restablecer la contraseña de un usuario mediante un token válido de recuperación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida correctamente',
    type: MessageResponseDto,
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verificar correo electrónico',
    description:
      'Confirma la dirección de correo de un usuario mediante un token enviado al mismo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Correo verificado correctamente',
    type: MessageResponseDto,
  })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'El logout es manejado en el cliente ya que JWT es **stateless**. Basta con eliminar el token del almacenamiento local.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cierre de sesión exitoso',
    type: MessageResponseDto,
  })
  async logout() {
    return {
      message:
        'Cierre de sesión exitoso. Elimine el token del almacenamiento del cliente.',
    };
  }
}
