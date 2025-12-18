import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './common/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('🌱 Iniciando seeding de base de datos...\n');

  try {
    // ==================== USUARIOS ====================
    console.log('👤 Creando usuarios...');

    // 1. Platform Admin
    const platformAdmin = await usersService.createUserWithPerson({
      firstName: 'Admin',
      lastName: 'Plataforma',
      email: 'admin@lavc.com',
      password: 'Admin123!',
      phone: '+51 999 888 777',
      dateOfBirth: '1985-01-15',
      roles: [UserRole.PLATFORM_ADMIN],
    });
    console.log('  ✅ Platform Admin creado:', platformAdmin.email);

    // 2. Company Admins
    const companyAdmin1 = await usersService.createUserWithPerson({
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos@techcorp.com',
      password: 'Carlos123!',
      phone: '+51 987 654 321',
      dateOfBirth: '1988-05-20',
      roles: [UserRole.COMPANY_ADMIN],
    });
    console.log('  ✅ Company Admin 1 creado:', companyAdmin1.email);

    const companyAdmin2 = await usersService.createUserWithPerson({
      firstName: 'María',
      lastName: 'González',
      email: 'maria@innovatech.com',
      password: 'Maria123!',
      phone: '+51 987 111 222',
      dateOfBirth: '1990-08-10',
      roles: [UserRole.COMPANY_ADMIN],
    });
    console.log('  ✅ Company Admin 2 creado:', companyAdmin2.email);

    // 3. Usuarios regulares
    const userNames = [
      { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
      { firstName: 'Ana', lastName: 'Martínez', email: 'ana@example.com' },
      { firstName: 'Pedro', lastName: 'López', email: 'pedro@example.com' },
      { firstName: 'Laura', lastName: 'García', email: 'laura@example.com' },
      { firstName: 'Diego', lastName: 'Sánchez', email: 'diego@example.com' },
      { firstName: 'Sofia', lastName: 'Torres', email: 'sofia@example.com' },
      { firstName: 'Miguel', lastName: 'Ramírez', email: 'miguel@example.com' },
      {
        firstName: 'Valentina',
        lastName: 'Flores',
        email: 'valentina@example.com',
      },
    ];

    for (const userData of userNames) {
      const user = await usersService.createUserWithPerson({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: 'User123!',
        phone: `+51 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
        dateOfBirth: `${1990 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        roles: [UserRole.USER],
      });
      console.log(`  ✅ Usuario creado: ${user.email}`);
    }

    // ==================== RESUMEN ====================
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log('================================');
    console.log(`👤 Usuarios: 11 (1 admin, 2 company admins, 8 usuarios)`);
    console.log('================================\n');

    console.log('📝 CREDENCIALES DE ACCESO:');
    console.log('================================');
    console.log('Platform Admin:');
    console.log('  Email: admin@lavc.com');
    console.log('  Password: Admin123!');
    console.log('');
    console.log('Company Admin 1:');
    console.log('  Email: carlos@techcorp.com');
    console.log('  Password: Carlos123!');
    console.log('');
    console.log('Company Admin 2:');
    console.log('  Email: maria@innovatech.com');
    console.log('  Password: Maria123!');
    console.log('');
    console.log('Usuarios Regulares:');
    console.log('  Email: juan@example.com, ana@example.com, etc.');
    console.log('  Password: User123!');
    console.log('================================\n');

    console.log('✅ Seeding completado exitosamente!');
    console.log('\n💡 NOTA: Este seeder solo crea usuarios.');
    console.log(
      '   Puedes crear eventos, empresas y sponsors desde el frontend',
    );
    console.log('   usando la cuenta de admin@lavc.com\n');
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    if (error.message?.includes('duplicate key')) {
      console.error('\n⚠️  Los datos ya existen en la base de datos.');
      console.error(
        '   Para volver a ejecutar el seeder, limpia la BD primero:\n',
      );
      console.error('   mongosh');
      console.error('   use lavc-db');
      console.error('   db.dropDatabase()');
      console.error('   exit\n');
    }
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
