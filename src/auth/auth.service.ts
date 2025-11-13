import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserWithPersonDto } from 'src/persons/dto/create-user-with-person.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDocument } from 'src/users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user =
      await this.usersService.findUserByEmailWithSensitiveFields(email);

    if (!user) {
      return null;
    }

    if (user.entityStatus !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user.id,
      password,
    );
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales no válidas');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      companyId: user.companyId?.toString(),
    };

    const access_token = this.jwtService.sign(payload);
    const expires_in = this.configService.getOrThrow<string>('jwt.expiresIn');

    const userDto = plainToInstance(UserDto, user.toJSON(), {
      excludeExtraneousValues: true,
    });

    const response: AuthResponseDto = {
      user: userDto,
      access_token,
      expires_in,
    };

    return response;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { firstName, lastName, email, password, phone, dateOfBirth } =
      registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Correo electrónico ya registrado');
    }

    try {
      const userWithPersonDto: CreateUserWithPersonDto = {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        password,
        roles: [UserRole.USER],
      };

      const user =
        await this.usersService.createUserWithPerson(userWithPersonDto);

      const verificationToken = this.generateVerificationToken();
      await this.usersService.update(user.id, {
        emailVerificationToken: verificationToken,
      });

      return this.login({ email, password });
    } catch (error) {
      throw new BadRequestException(error.message || 'El registro ha fallado.');
    }
  }

  async registerCompanyAdmin(
    registerDto: RegisterDto & { companyId: string },
  ): Promise<AuthResponseDto> {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      companyId,
    } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Correo electrónico ya registrado');
    }

    const userWithPersonDto = {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      password,
      role: UserRole.COMPANY_ADMIN,
      companyId,
    };

    const user =
      await this.usersService.createUserWithPerson(userWithPersonDto);

    const verificationToken = this.generateVerificationToken();
    await this.usersService.update(user.id.toString(), {
      emailVerificationToken: verificationToken,
    });

    return this.login({ email, password });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await this.usersService.validatePassword(
      user.id,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    await this.usersService.updatePassword(userId, newPassword);

    return { message: 'Contraseña cambiada correctamente' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Usuario no encontrado' };
    }

    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.usersService.update(user.id.toString(), {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    const isDevelopment =
      this.configService.get('app.nodeEnv') === 'development';

    if (isDevelopment) {
      return {
        message: 'Se ha generado un token para restablecer la contraseña.',
      };
    }

    return {
      message: 'Se ha enviado un enlace para restablecer la contraseña.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    const { token, newPassword } = resetPasswordDto;

    const userId = await this.usersService.findUserByResetToken(token);
    const user = await this.usersService.findUserWithSensitiveFields(userId);

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new UnauthorizedException(
        'Token de restablecimiento no válido o caducado',
      );
    }

    await this.usersService.updatePassword(user.id.toString(), newPassword);
    await this.usersService.update(user.id.toString(), {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return { message: 'Contraseña restablecida correctamente' };
  }

  async verifyEmail(token: string): Promise<MessageResponseDto> {
    const userId = await this.usersService.findUserByVerificationToken(token);

    if (!userId) {
      throw new UnauthorizedException('Token de verificación no válido');
    }

    await this.usersService.verifyEmail(userId);

    return { message: 'Correo electrónico verificado correctamente' };
  }

  async refreshToken(userId: string): Promise<RefreshTokenResponseDto> {
    const user = await this.usersService.findOne(userId);

    if (!user || user.entityStatus !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      roles: user.roles,
      companyId: user.company?.id.toString(),
    };

    const access_token = this.jwtService.sign(payload);
    const expires_in = this.configService.getOrThrow<string>('jwt.expiresIn');

    return { access_token, expires_in };
  }

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  private generateVerificationToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private generateResetToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
