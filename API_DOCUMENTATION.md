# 📚 API Documentation - LAVC Backend

Documentación completa de la API REST para el sistema de gestión de eventos LAVC.

**Base URL:** `http://localhost:3000` (desarrollo)

**Formato:** JSON

**Autenticación:** JWT Bearer Token

---

## 📑 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Empresas](#empresas)
4. [Eventos](#eventos)
5. [Sponsors](#sponsors)
6. [Invitaciones](#invitaciones)
7. [Staff Operativo](#staff-operativo)
8. [Participantes](#participantes)
9. [Tickets](#tickets)
10. [Códigos QR](#códigos-qr)
11. [Flujos de Integración](#flujos-de-integración)

---

## 🔐 Autenticación

### Login

Autentica un usuario y retorna un token JWT.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "admin@lavc.com",
  "password": "Admin123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@lavc.com",
    "roles": ["PLATFORM_ADMIN"],
    "person": {
      "firstName": "Admin",
      "lastName": "Plataforma"
    }
  }
}
```

**Ejemplo curl:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lavc.com","password":"Admin123!"}'
```

**Ejemplo JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@lavc.com',
    password: 'Admin123!'
  })
});
const data = await response.json();
localStorage.setItem('token', data.accessToken);
```

---

## 👤 Usuarios

### Obtener Perfil Actual

**Endpoint:** `GET /users/me`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "admin@lavc.com",
  "roles": ["PLATFORM_ADMIN"],
  "person": {
    "firstName": "Admin",
    "lastName": "Plataforma",
    "phone": "+51 999 888 777"
  }
}
```

### Obtener Roles de Staff

Retorna los eventos donde el usuario es staff operativo y los sponsors donde es staff de sponsor.

**Endpoint:** `GET /users/me/staff-roles`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "hasStaffRoles": true,
  "operationalStaff": [
    {
      "eventId": "event123",
      "eventTitle": "Congreso Internacional de Tecnología 2025",
      "eventStartDate": "2025-10-15T09:00:00.000Z",
      "eventEndDate": "2025-10-17T18:00:00.000Z",
      "participantId": "part123",
      "role": "operational_staff",
      "canAccess": true
    }
  ],
  "sponsorStaff": [
    {
      "eventId": "event123",
      "eventTitle": "Congreso Internacional de Tecnología 2025",
      "sponsorId": "sponsor456",
      "sponsorName": "TechCorp Solutions",
      "participantId": "part456",
      "role": "sponsor_staff",
      "canAccess": true
    }
  ]
}
```

**Ejemplo JavaScript:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/users/me/staff-roles', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const staffRoles = await response.json();

// Mostrar menú dinámicamente
if (staffRoles.hasStaffRoles) {
  // Mostrar opciones de staff
}
```

### Registrar Usuario

**Endpoint:** `POST /users/register`

**Request:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "password": "User123!",
  "phone": "+51 987 654 321",
  "dateOfBirth": "1995-05-15"
}
```

**Response:** `201 Created`
```json
{
  "id": "user123",
  "email": "juan@example.com",
  "person": {
    "firstName": "Juan",
    "lastName": "Pérez"
  }
}
```

---

## 🏢 Empresas

### Listar Empresas

**Endpoint:** `GET /companies`

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 10)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "company123",
      "name": "TechCorp Solutions",
      "ruc": "20123456789",
      "email": "contacto@techcorp.com",
      "phone": "+51 1 234 5678"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Crear Empresa

**Endpoint:** `POST /companies`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN

**Request:**
```json
{
  "name": "TechCorp Solutions",
  "ruc": "20123456789",
  "address": {
    "street": "Av. Javier Prado 123",
    "city": "Lima",
    "state": "Lima",
    "country": "Perú",
    "zipCode": "15036"
  },
  "phone": "+51 1 234 5678",
  "email": "contacto@techcorp.com",
  "website": "https://techcorp.com",
  "adminId": "user123"
}
```

**Response:** `201 Created`

---

## 📅 Eventos

### Listar Eventos

**Endpoint:** `GET /events`

**Query Params:**
- `page` (opcional): Número de página
- `limit` (opcional): Items por página
- `search` (opcional): Búsqueda por título

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "event123",
      "title": "Congreso Internacional de Tecnología 2025",
      "description": "El evento tech más importante del año...",
      "startDate": "2025-10-15T09:00:00.000Z",
      "endDate": "2025-10-17T18:00:00.000Z",
      "location": {
        "name": "Centro de Convenciones de Lima",
        "address": "Av. Universitaria 1801"
      },
      "capacity": 500,
      "imageUrl": "https://picsum.photos/seed/tech2025/800/600",
      "ticketTypes": [
        {
          "id": "ticket1",
          "name": "General",
          "price": 150.00,
          "quantity": 300
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Obtener Evento por ID

**Endpoint:** `GET /events/:eventId`

**Response:** `200 OK`
```json
{
  "id": "event123",
  "title": "Congreso Internacional de Tecnología 2025",
  "description": "El evento tech más importante del año...",
  "startDate": "2025-10-15T09:00:00.000Z",
  "endDate": "2025-10-17T18:00:00.000Z",
  "location": {
    "name": "Centro de Convenciones de Lima",
    "address": "Av. Universitaria 1801",
    "coordinates": {
      "latitude": -12.0464,
      "longitude": -77.0428
    }
  },
  "capacity": 500,
  "ticketTypes": [...]
}
```

### Crear Evento

**Endpoint:** `POST /events`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN, COMPANY_ADMIN

**Request:**
```json
{
  "title": "Congreso Internacional de Tecnología 2025",
  "description": "El evento tech más importante del año",
  "startDate": "2025-10-15T09:00:00.000Z",
  "endDate": "2025-10-17T18:00:00.000Z",
  "location": {
    "name": "Centro de Convenciones de Lima",
    "address": "Av. Universitaria 1801",
    "city": "Lima",
    "country": "Perú"
  },
  "capacity": 500,
  "imageUrl": "https://example.com/image.jpg",
  "ticketTypes": [
    {
      "name": "General",
      "description": "Acceso a todas las conferencias",
      "price": 150.00,
      "quantity": 300,
      "availableFrom": "2025-08-01T00:00:00.000Z",
      "availableUntil": "2025-10-14T23:59:59.000Z"
    }
  ]
}
```

**Response:** `201 Created`

---

## 🤝 Sponsors

### Listar Sponsors de un Evento

**Endpoint:** `GET /events/:eventId/sponsors`

**Response:** `200 OK`
```json
[
  {
    "id": "sponsor123",
    "company": {
      "id": "company123",
      "name": "TechCorp Solutions"
    },
    "sponsorshipLevel": "gold",
    "staffQuota": 5,
    "staffUsed": 2,
    "guestQuota": 10,
    "guestUsed": 5,
    "scholarshipQuota": 3,
    "scholarshipUsed": 1,
    "isActive": true
  }
]
```

### Agregar Sponsor a Evento

**Endpoint:** `POST /events/:eventId/sponsors`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN, COMPANY_ADMIN

**Request:**
```json
{
  "companyId": "company123",
  "sponsorshipLevel": "gold",
  "staffQuota": 5,
  "guestQuota": 10,
  "scholarshipQuota": 3,
  "benefits": [
    "Logo en material promocional",
    "Stand premium de 20m²"
  ]
}
```

**Response:** `201 Created`

---

## ✉️ Invitaciones

### Crear Invitación (Sponsor)

**Endpoint:** `POST /events/:eventId/sponsors/:sponsorId/invitations`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN, COMPANY_ADMIN

**Request:**
```json
{
  "participantType": "guest",
  "usageType": "multiple",
  "maxUses": 5,
  "expiresAt": "2025-10-14T23:59:59.000Z",
  "ticketTypeId": "ticket123"
}
```

**Response:** `201 Created`
```json
{
  "id": "invitation123",
  "code": "ABC123XYZ",
  "participantType": "guest",
  "usageType": "multiple",
  "maxUses": 5,
  "currentUses": 0,
  "expiresAt": "2025-10-14T23:59:59.000Z",
  "isActive": true,
  "invitationLink": "https://tu-app.com/invitations/ABC123XYZ"
}
```

### Crear Invitación de Staff Operativo

**Endpoint:** `POST /events/:eventId/operational-staff-invitations`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN

**Request:**
```json
{
  "participantType": "operational_staff",
  "usageType": "multiple",
  "maxUses": 10,
  "expiresAt": "2025-10-14T23:59:59.000Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "invitation456",
  "code": "XYZ789ABC",
  "participantType": "operational_staff",
  "usageType": "multiple",
  "maxUses": 10,
  "currentUses": 0
}
```

### Validar Invitación

**Endpoint:** `GET /invitations/:code/validate`

**Response:** `200 OK`
```json
{
  "isValid": true,
  "invitation": {
    "code": "ABC123XYZ",
    "participantType": "guest",
    "event": {
      "id": "event123",
      "title": "Congreso Internacional de Tecnología 2025"
    },
    "usesRemaining": 3
  }
}
```

### Aceptar Invitación

**Endpoint:** `POST /invitations/:code/accept`

**Headers:** `Authorization: Bearer {token}` (opcional - si el usuario ya está logueado)

**Request (usuario autenticado):**
```json
{
  "acceptWithAuth": true
}
```

**Request (nuevo usuario - auto-registro):**
```json
{
  "acceptWithAuth": false,
  "userData": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "password": "User123!",
    "phone": "+51 987 654 321",
    "dateOfBirth": "1995-05-15"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "participant": {
    "id": "part123",
    "participantType": "guest"
  },
  "ticket": {
    "id": "ticket123",
    "ticketNumber": "TKT-2025-001234"
  },
  "user": {
    "id": "user123",
    "email": "juan@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👷 Staff Operativo

### Asignar Staff Operativo

**Endpoint:** `POST /events/:eventId/participants/operational-staff`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN

**Request:**
```json
{
  "userId": "user123",
  "notes": "Responsable de check-in en entrada principal"
}
```

**Response:** `201 Created`
```json
{
  "id": "part123",
  "userId": "user123",
  "eventId": "event123",
  "participantType": "operational_staff",
  "isActive": true,
  "registeredAt": "2025-06-01T10:00:00.000Z"
}
```

### Listar Staff Operativo de un Evento

**Endpoint:** `GET /events/:eventId/participants/operational-staff`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN, COMPANY_ADMIN

**Response:** `200 OK`
```json
[
  {
    "id": "part123",
    "user": {
      "id": "user123",
      "email": "juan@example.com",
      "person": {
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    },
    "participantType": "operational_staff",
    "isActive": true,
    "registeredAt": "2025-06-01T10:00:00.000Z"
  }
]
```

### Remover Staff Operativo

**Endpoint:** `DELETE /events/:eventId/participants/operational-staff/:participantId`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN

**Response:** `204 No Content`

---

## 🎫 Participantes

### Listar Participantes de un Evento

**Endpoint:** `GET /events/:eventId/participants`

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `participantType` (opcional): Filtrar por tipo (staff, guest, scholarship, operational_staff)

**Response:** `200 OK`
```json
[
  {
    "id": "part123",
    "user": {
      "email": "juan@example.com",
      "person": {
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    },
    "participantType": "guest",
    "eventSponsor": {
      "company": {
        "name": "TechCorp Solutions"
      }
    },
    "registeredAt": "2025-06-01T10:00:00.000Z"
  }
]
```

---

## 🎟️ Tickets

### Obtener Mis Tickets

**Endpoint:** `GET /tickets/my-tickets`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
[
  {
    "id": "ticket123",
    "ticketNumber": "TKT-2025-001234",
    "event": {
      "id": "event123",
      "title": "Congreso Internacional de Tecnología 2025",
      "startDate": "2025-10-15T09:00:00.000Z"
    },
    "ticketType": {
      "name": "General",
      "price": 150.00
    },
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "status": "active",
    "sourceType": "invitation"
  }
]
```

### Obtener Ticket por ID

**Endpoint:** `GET /tickets/:ticketId`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "id": "ticket123",
  "ticketNumber": "TKT-2025-001234",
  "event": {...},
  "ticketType": {...},
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "validatedAt": null,
  "status": "active"
}
```

---

## 📱 Códigos QR

### Generar QR para Ticket

**Endpoint:** `POST /qr/generate`

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "ticketId": "ticket123"
}
```

**Response:** `200 OK`
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "ticketNumber": "TKT-2025-001234"
}
```

### Validar QR (Check-in)

**Endpoint:** `POST /qr/validate`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN, COMPANY_ADMIN, EVENT_STAFF, o OPERATIONAL_STAFF del evento

**Request:**
```json
{
  "qrCode": "TKT-2025-001234",
  "eventId": "event123"
}
```

**Response:** `200 OK` (Éxito)
```json
{
  "success": true,
  "message": "Check-in exitoso",
  "ticket": {
    "ticketNumber": "TKT-2025-001234",
    "attendee": {
      "firstName": "Juan",
      "lastName": "Pérez"
    },
    "ticketType": "General"
  },
  "validatedAt": "2025-10-15T09:30:00.000Z"
}
```

**Response:** `400 Bad Request` (Ya validado)
```json
{
  "success": false,
  "message": "Este ticket ya fue validado anteriormente",
  "validatedAt": "2025-10-15T09:15:00.000Z"
}
```

### Obtener Estadísticas del Evento

**Endpoint:** `GET /qr/event/:eventId/stats`

**Headers:** `Authorization: Bearer {token}`

**Roles:** PLATFORM_ADMIN, COMPANY_ADMIN, EVENT_STAFF, o OPERATIONAL_STAFF del evento

**Response:** `200 OK`
```json
{
  "totalTickets": 450,
  "checkedIn": 320,
  "pending": 130,
  "checkInRate": 71.11,
  "byTicketType": [
    {
      "name": "General",
      "total": 280,
      "checkedIn": 210
    },
    {
      "name": "VIP",
      "total": 90,
      "checkedIn": 75
    }
  ],
  "byHour": [
    {
      "hour": "09:00",
      "count": 45
    },
    {
      "hour": "10:00",
      "count": 78
    }
  ]
}
```

---

## 🔄 Flujos de Integración

### Flujo 1: Login y Obtener Roles

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@lavc.com',
    password: 'Admin123!'
  })
});
const { accessToken, user } = await loginResponse.json();
localStorage.setItem('token', accessToken);

// 2. Obtener roles de staff
const staffResponse = await fetch('http://localhost:3000/users/me/staff-roles', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const staffRoles = await staffResponse.json();

// 3. Mostrar menú dinámicamente
if (staffRoles.hasStaffRoles) {
  if (staffRoles.operationalStaff.length > 0) {
    // Mostrar opciones de staff operativo
    console.log('Staff operativo de:', staffRoles.operationalStaff);
  }
  if (staffRoles.sponsorStaff.length > 0) {
    // Mostrar opciones de staff de sponsor
    console.log('Staff de sponsor:', staffRoles.sponsorStaff);
  }
}
```

### Flujo 2: Aceptar Invitación (Usuario Nuevo)

```javascript
// 1. Validar código de invitación
const validateResponse = await fetch(`http://localhost:3000/invitations/ABC123XYZ/validate`);
const validation = await validateResponse.json();

if (validation.isValid) {
  // 2. Aceptar invitación con auto-registro
  const acceptResponse = await fetch('http://localhost:3000/invitations/ABC123XYZ/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acceptWithAuth: false,
      userData: {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        password: 'User123!',
        phone: '+51 987 654 321',
        dateOfBirth: '1995-05-15'
      }
    })
  });
  
  const result = await acceptResponse.json();
  
  // 3. Guardar token y redirigir
  localStorage.setItem('token', result.accessToken);
  console.log('Ticket generado:', result.ticket.ticketNumber);
  // Redirigir a /my-tickets
}
```

### Flujo 3: Escanear QR (Staff Operativo)

```javascript
const token = localStorage.getItem('token');

// 1. Escanear código QR (obtener del scanner)
const qrCode = 'TKT-2025-001234';

// 2. Validar QR
const response = await fetch('http://localhost:3000/qr/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qrCode: qrCode,
    eventId: 'event123'
  })
});

const result = await response.json();

if (result.success) {
  // Mostrar mensaje de éxito
  console.log('✅ Check-in exitoso:', result.ticket.attendee);
} else {
  // Mostrar error
  console.error('❌ Error:', result.message);
}
```

### Flujo 4: Crear Evento y Asignar Staff

```javascript
const token = localStorage.getItem('token');

// 1. Crear evento
const eventResponse = await fetch('http://localhost:3000/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mi Evento',
    description: 'Descripción del evento',
    startDate: '2025-12-01T09:00:00.000Z',
    endDate: '2025-12-01T18:00:00.000Z',
    location: {
      name: 'Centro de Convenciones',
      address: 'Av. Principal 123',
      city: 'Lima',
      country: 'Perú'
    },
    capacity: 200,
    ticketTypes: [
      {
        name: 'General',
        price: 50.00,
        quantity: 200
      }
    ]
  })
});
const event = await eventResponse.json();

// 2. Crear invitación de staff operativo
const invitationResponse = await fetch(
  `http://localhost:3000/events/${event.id}/operational-staff-invitations`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      participantType: 'operational_staff',
      usageType: 'multiple',
      maxUses: 10,
      expiresAt: '2025-11-30T23:59:59.000Z'
    })
  }
);
const invitation = await invitationResponse.json();

console.log('Link de invitación:', `https://tu-app.com/invitations/${invitation.code}`);
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Solicitud exitosa sin contenido |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email duplicado) |
| 500 | Internal Server Error - Error del servidor |

---

## 🔑 Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `PLATFORM_ADMIN` | Administrador de plataforma | Acceso total |
| `COMPANY_ADMIN` | Administrador de empresa | Gestión de su empresa y eventos |
| `EVENT_STAFF` | Staff de evento | Validación de QR |
| `USER` | Usuario regular | Compra de tickets, ver eventos |

**Staff Operativo:** No es un rol permanente, se asigna por evento y expira automáticamente.

---

## 💡 Notas Importantes

1. **Tokens JWT:** Incluir en header `Authorization: Bearer {token}` para endpoints protegidos
2. **Fechas:** Usar formato ISO 8601 (`2025-10-15T09:00:00.000Z`)
3. **IDs:** Todos los IDs son strings de MongoDB ObjectId
4. **Paginación:** Por defecto 10 items por página
5. **CORS:** Configurar según tu dominio de frontend

---

## 🚀 Próximos Pasos

1. Implementa el servicio de autenticación en tu frontend
2. Crea un interceptor para agregar el token automáticamente
3. Implementa manejo de errores global
4. Crea hooks/composables para cada módulo
5. Implementa refresh token si es necesario

---

**Última actualización:** Diciembre 2024

**Versión de API:** 1.0.0
