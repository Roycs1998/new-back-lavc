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

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
    emailVerified: boolean;
    person: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
    company?: {
      name: string;
      entityStatus: string;
    };
  };
  access_token: string;
  expires_in: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (user.entityStatus !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user._id);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString(),
    };

    const access_token = this.jwtService.sign(payload);
    const expires_in = this.configService.getOrThrow<string>('jwt.expiresIn');

    const response: AuthResponse = {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        companyId: user.companyId?.toString(),
        emailVerified: user.emailVerified,
        person: {
          firstName: user.personId.firstName,
          lastName: user.personId.lastName,
          phone: user.personId.phone,
        },
        ...(user.companyId && {
          company: {
            name: user.companyId.name,
            entityStatus: user.companyId.entityStatus,
          },
        }),
      },
      access_token,
      expires_in,
    };

    return response;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { firstName, lastName, email, password, phone, dateOfBirth } =
      registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    try {
      const userWithPersonDto = {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        password,
        role: UserRole.USER,
      };

      const { user } =
        await this.usersService.createUserWithPerson(userWithPersonDto);

      const verificationToken = this.generateVerificationToken();
      await this.usersService.update(user._id.toString(), {
        emailVerificationToken: verificationToken,
      });

      return this.login({ email, password });
    } catch (error) {
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async registerCompanyAdmin(
    registerDto: RegisterDto & { companyId: string },
  ): Promise<AuthResponse> {
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
      throw new ConflictException('Email already registered');
    }

    try {
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

      const { user } =
        await this.usersService.createUserWithPerson(userWithPersonDto);

      const verificationToken = this.generateVerificationToken();
      await this.usersService.update(user._id.toString(), {
        emailVerificationToken: verificationToken,
      });

      return this.login({ email, password });
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Company admin registration failed',
      );
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findByEmail(
      (await this.usersService.findOne(userId)).email,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await this.usersService.validatePassword(
      user,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.updatePassword(userId, newPassword);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.usersService.update(user._id.toString(), {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    const isDevelopment =
      this.configService.get('app.nodeEnv') === 'development';

    if (isDevelopment) {
      return {
        message: 'Password reset token generated',
      };
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.usersService.findOne(
      await this.usersService.findUserByResetToken(token),
    );

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user._id.toString(), newPassword);
    await this.usersService.update(user._id.toString(), {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId = await this.usersService.findUserByVerificationToken(token);

    if (!userId) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.usersService.verifyEmail(userId);

    return { message: 'Email verified successfully' };
  }

  async refreshToken(
    userId: string,
  ): Promise<{ access_token: string; expires_in: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user || user.entityStatus !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString(),
    };

    const access_token = this.jwtService.sign(payload);
    const expires_in = this.configService.getOrThrow<string>('jwt.expiresIn');

    return { access_token, expires_in };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      person: user.personId,
      company: user.companyId,
    };
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
