import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EntityStatus } from '../src/common/enums/entity-status.enum';
import { PersonType } from '../src/common/enums/person-type.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('PersonsController (e2e)', () => {
  let app: INestApplication;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            _id: '68ac5b3ac99e053a5983762f',
            role: UserRole.PLATFORM_ADMIN,
          }; // 👈 mock user
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /** ----------------------------------------
   * CREATE PERSON
   * ---------------------------------------- */
  it('/POST persons → should create a new person', async () => {
    const res = await request(app.getHttpServer())
      .post('/persons')
      .send({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        phone: '+51987654321',
        type: PersonType.USER_PERSON,
      })
      .expect(201);

    console.log('POST response:', res.body);

    expect(res.body).toHaveProperty('id');
    expect(res.body.firstName).toBe('Juan');
    expect(res.body.entityStatus).toBe(EntityStatus.ACTIVE);

    createdId = res.body.id;
    expect(createdId).toBeDefined();
  });

  /** ----------------------------------------
   * FIND ALL
   * ---------------------------------------- */
  it('/GET persons → should return a paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/persons?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('currentPage');
  });

  /** ----------------------------------------
   * FIND ONE
   * ---------------------------------------- */
  it('/GET persons/:id → should return a person by ID', async () => {
    const res = await request(app.getHttpServer()).get(`/persons/${createdId}`);

    expect(res.body.id).toBe(createdId);
    expect(res.body.firstName).toBe('Juan');
  });

  /** ----------------------------------------
   * UPDATE
   * ---------------------------------------- */
  it('/PATCH persons/:id → should update person', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/persons/${createdId}`)
      .send({ firstName: 'Carlos' })
      .expect(200);

    expect(res.body.firstName).toBe('Carlos');
  });

  /** ----------------------------------------
   * CHANGE STATUS
   * ---------------------------------------- */
  it('/PATCH persons/:id/status → should change status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/persons/${createdId}/status`)
      .send({ entityStatus: EntityStatus.INACTIVE })
      .expect(200);

    expect(res.body.entityStatus).toBe(EntityStatus.INACTIVE);
  });

  /** ----------------------------------------
   * SOFT DELETE
   * ---------------------------------------- */
  it('/DELETE persons/:id → should soft delete person', async () => {
    await request(app.getHttpServer())
      .delete(`/persons/${createdId}`)
      .expect(204);

    // Verify it was deleted
    await request(app.getHttpServer()).get(`/persons/${createdId}`).expect(404);
  });
});
