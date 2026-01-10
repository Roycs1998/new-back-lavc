# 📚 Documentación de Endpoints - Nuevas Funcionalidades

Documentación completa de los endpoints implementados para gestión de imágenes de speakers/companies, invitaciones masivas y aceptación de invitaciones por admin.

---

## 📸 1. Gestión de Fotos de Speakers

### 1.1 Actualizar/Subir Foto de Speaker

**Endpoint:** `PATCH /speakers/:id/photo`

**Autenticación:** Requerida (JWT)

**Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `USER`

**Tipo de contenido:** `multipart/form-data`

#### Request

```typescript
// Form Data
{
  file: File; // Imagen del speaker (JPG, PNG, etc.)
}
```

#### Parámetros de URL

- `id` (string, required): ID del speaker

#### Response (200 OK)

```typescript
{
  id: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;  // ✅ URL de la nueva foto
    // ... otros campos
  };
  companyId: string;
  bio?: string;
  expertise?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  // ... otros campos
}
```

#### Funcionamiento

- Si el speaker ya tiene una foto, **automáticamente se elimina la anterior**
- La nueva foto se sube y la URL se guarda en `person.avatar`
- Se aplican validaciones de tamaño y tipo de archivo en el `StorageService`

#### Ejemplo de uso (Frontend)

```typescript
const uploadSpeakerPhoto = async (speakerId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/speakers/${speakerId}/photo`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

---

### 1.2 Eliminar Foto de Speaker

**Endpoint:** `DELETE /speakers/:id/photo`

**Autenticación:** Requerida (JWT)

**Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `USER`

#### Parámetros de URL

- `id` (string, required): ID del speaker

#### Response (200 OK)

```typescript
{
  id: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar: null;  // ✅ Foto eliminada
    // ... otros campos
  };
  // ... otros campos del speaker
}
```

#### Funcionamiento

- Elimina la foto del storage (DigitalOcean Spaces)
- Actualiza `person.avatar` a `null`

#### Ejemplo de uso (Frontend)

```typescript
const deleteSpeakerPhoto = async (speakerId: string) => {
  const response = await fetch(`/api/speakers/${speakerId}/photo`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
};
```

---

## 🏢 2. Gestión de Logos de Empresas

### 2.1 Actualizar/Subir Logo de Empresa

**Endpoint:** `PATCH /companies/:id/logo`

**Autenticación:** Requerida (JWT)

**Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`

**Tipo de contenido:** `multipart/form-data`

#### Request

```typescript
// Form Data
{
  file: File; // Logo de la empresa (JPG, PNG, etc.)
}
```

#### Parámetros de URL

- `id` (string, required): ID de la empresa

#### Response (200 OK)

```typescript
{
  id: string;
  name: string;
  ruc?: string;
  logo?: string;  // ✅ URL del nuevo logo
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  industryType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Funcionamiento

- Si la empresa ya tiene un logo, **automáticamente se elimina el anterior**
- El nuevo logo se sube y la URL se guarda en `logo`
- Se aplican validaciones de tamaño y tipo de archivo en el `StorageService`

#### Ejemplo de uso (Frontend)

```typescript
const uploadCompanyLogo = async (companyId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/companies/${companyId}/logo`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

---

### 2.2 Eliminar Logo de Empresa

**Endpoint:** `DELETE /companies/:id/logo`

**Autenticación:** Requerida (JWT)

**Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`

#### Parámetros de URL

- `id` (string, required): ID de la empresa

#### Response (200 OK)

```typescript
{
  id: string;
  name: string;
  ruc?: string;
  logo: null;  // ✅ Logo eliminado
  // ... otros campos de la empresa
}
```

#### Funcionamiento

- Elimina el logo del storage (DigitalOcean Spaces)
- Actualiza `logo` a `null`

#### Ejemplo de uso (Frontend)

```typescript
const deleteCompanyLogo = async (companyId: string) => {
  const response = await fetch(`/api/companies/${companyId}/logo`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
};
```

---

## 🎟️ 3. Creación Masiva de Invitaciones

### 3.1 Crear Múltiples Invitaciones (Bulk)

**Endpoint:** `POST /events/:eventId/sponsors/:sponsorId/invitations/bulk`

**Autenticación:** Requerida (JWT)

**Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `USER`

#### Parámetros de URL

- `eventId` (string, required): ID del evento
- `sponsorId` (string, required): ID del sponsor

#### Request Body

```typescript
{
  quantity: number;           // Min: 1, Max: 100
  participantType: string;    // 'STAFF' | 'GUEST' | 'SCHOLARSHIP' | 'OPERATIONAL_STAFF'
  ticketTypeId?: string;      // Opcional, requerido para SCHOLARSHIP si no se quiere el más barato
  expiresAt?: string;         // Opcional, formato ISO 8601
}
```

#### Response (201 Created)

```typescript
{
  success: boolean;
  created: number; // Cantidad de invitaciones creadas
  invitations: Array<{
    id: string;
    eventSponsorId: string;
    eventId: string;
    code: string; // Código único de invitación
    participantType: string;
    ticketTypeId?: string;
    usageType: 'SINGLE'; // ✅ Todas son de uso único
    maxUses: null;
    currentUses: number;
    remainingUses: null;
    expiresAt?: string;
    isActive: boolean;
    ticketType?: {
      id: string;
      name: string;
      price: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  limits: {
    remaining: number; // Cuota restante después de crear
    total: number; // Cuota total disponible
  }
}
```

#### Validaciones

- ✅ Valida que haya cuota suficiente **antes** de crear cualquier invitación
- ✅ Operación atómica: todas se crean o ninguna
- ✅ Máximo 100 invitaciones por request
- ✅ Todas las invitaciones son **de uso único** (maxUses = 1)
- ✅ Códigos únicos generados automáticamente

#### Ejemplo de uso (Frontend)

```typescript
interface CreateBulkInvitationsDto {
  quantity: number;
  participantType: 'STAFF' | 'GUEST' | 'SCHOLARSHIP' | 'OPERATIONAL_STAFF';
  ticketTypeId?: string;
  expiresAt?: string;
}

const createBulkInvitations = async (
  eventId: string,
  sponsorId: string,
  data: CreateBulkInvitationsDto,
) => {
  const response = await fetch(
    `/api/events/${eventId}/sponsors/${sponsorId}/invitations/bulk`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  return await response.json();
};

// Ejemplo de uso
const result = await createBulkInvitations(
  '66c0da2b6a3aa6ed3c63e001',
  '66c0da2b6a3aa6ed3c63e004',
  {
    quantity: 50,
    participantType: 'GUEST',
    expiresAt: '2025-12-31T23:59:59Z',
  },
);

console.log(`Creadas ${result.created} invitaciones`);
console.log(`Cuota restante: ${result.limits.remaining}`);
```

#### Casos de uso

- Crear múltiples enlaces para distribuir en evento presencial
- Generar invitaciones masivas para patrocinadores
- Automatizar creación de becas

---

## 👥 4. Aceptación de Invitaciones por Admin

### 4.1 Aceptar Invitación en Nombre de un Usuario

**Endpoint:** `POST /invitations/:code/accept-for-user`

**Autenticación:** Requerida (JWT)

**Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`

⚠️ **Nota:** Este endpoint permite que un admin registre a un usuario en un evento sin que el usuario tenga que hacerlo manualmente.

#### Parámetros de URL

- `code` (string, required): Código de invitación

#### Request Body

```typescript
{
  userId: string; // ID del usuario a registrar (MongoDB ObjectId)
}
```

#### Response (201 Created)

```typescript
{
  user: {
    id: string;
    email: string;
    fullName: string;
  }
  message: string; // "Usuario registrado en el evento exitosamente"
}
```

#### Validaciones

- ✅ El código de invitación debe ser válido y activo
- ✅ El usuario debe existir en el sistema
- ✅ El usuario no debe estar ya registrado en el evento
- ✅ Debe haber cuota disponible (si aplica)
- ✅ La invitación no debe estar expirada
- ✅ La invitación debe tener usos disponibles

#### Funcionamiento

1. Busca el usuario por `userId`
2. Valida que existe
3. Valida el código de invitación (igual que endpoint público)
4. Verifica que el usuario no esté ya registrado
5. Registra el participante en el evento
6. Actualiza el uso de la invitación
7. Retorna confirmación con datos del usuario

#### Ejemplo de uso (Frontend)

```typescript
interface AcceptInvitationForUserDto {
  userId: string;
}

const acceptInvitationForUser = async (code: string, userId: string) => {
  const response = await fetch(`/api/invitations/${code}/accept-for-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
};

// Ejemplo con manejo de errores
try {
  const result = await acceptInvitationForUser(
    'ACME2025-XYZ789',
    '66c0da2b6a3aa6ed3c63e002',
  );

  console.log(`✅ ${result.user.fullName} registrado exitosamente`);
  console.log(`Email: ${result.user.email}`);
} catch (error) {
  console.error('Error al registrar usuario:', error.message);
  // Posibles errores:
  // - "Usuario no encontrado"
  // - "Código de invitación no válido"
  // - "El usuario ya está registrado en este evento"
  // - "Invitación expirada"
  // - "No hay usos disponibles"
}
```

#### Casos de uso

- Registro masivo en eventos presenciales
- Admins registrando participantes en sitio
- Automatización de registros desde sistemas externos
- Agilizar proceso de check-in

---

## 📋 5. Mejoras en Listado de Invitaciones

### 5.1 Información de Usuarios en `uses`

Ahora cuando se obtienen invitaciones, el campo `uses` incluye información completa del usuario que aceptó la invitación:

#### Estructura anterior

```typescript
{
  uses: [{
    userId: string;
    participantId: string;
    usedAt: Date;
  }]
}
```

#### Estructura nueva ✅

```typescript
{
  uses: [{
    user: {
      id: string;
      email: string;
      person: {
        id: string;
        firstName: string;
        lastName: string;
        fullName: string;
        email: string;
        phone?: string;
        avatar?: string;
      };
    };
    participantId: string;
    usedAt: Date;
  }]
}
```

#### Beneficio

Ahora puedes mostrar **quién usó cada invitación** sin hacer peticiones adicionales:

```typescript
// Ejemplo: Mostrar usuarios que usaron una invitación
invitation.uses.forEach((use) => {
  console.log(`${use.user.person.fullName} (${use.user.email})`);
  console.log(`Usado el: ${new Date(use.usedAt).toLocaleDateString()}`);
});
```

---

## 🔧 Utilidades y Funciones Helper

### Extracción de Key de URL

Se creó una función utilitaria compartida para extraer la clave de archivo de una URL pública:

**Ubicación:** `/src/utils/extractKeyFromUrl.ts`

```typescript
export function extractKeyFromUrl(url: string): string {
  const urlObject = new URL(url);
  return urlObject.pathname.substring(1);
}
```

Esta función es utilizada por `SpeakersService` y `CompaniesService` para extraer la clave del archivo antes de eliminarlo del storage.

---

## 🎯 Resumen de Cambios

### Endpoints Nuevos

1. ✅ `PATCH /speakers/:id/photo` - Subir/actualizar foto de speaker
2. ✅ `DELETE /speakers/:id/photo` - Eliminar foto de speaker
3. ✅ `PATCH /companies/:id/logo` - Subir/actualizar logo de empresa
4. ✅ `DELETE /companies/:id/logo` - Eliminar logo de empresa
5. ✅ `POST /events/:eventId/sponsors/:sponsorId/invitations/bulk` - Crear invitaciones masivas
6. ✅ `POST /invitations/:code/accept-for-user` - Aceptar invitación por admin

### DTOs Nuevos

1. `CreateBulkInvitationsDto` - Para creación masiva
2. `BulkInvitationsResponseDto` - Respuesta de creación masiva
3. `AcceptInvitationForUserDto` - Para aceptación por admin
4. `InvitationUserDto` - Tipo Pick para información de usuario en `uses`

### Mejoras en DTOs Existentes

1. `SponsorInvitationDto` - Ahora `uses` incluye información completa del usuario
2. `ShortPersonDto` - Agregado campo `avatar`
3. `CompanyDto` - Agregado campo `logo`
4. `CreatePersonDto` - Agregado campo opcional `avatar`

---

## 🚀 Flujos de Implementación en Frontend

### Flujo 1: Gestión de Foto de Speaker

```typescript
// 1. Componente de edición de speaker
const SpeakerPhotoManager = ({ speakerId, currentPhotoUrl }) => {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/speakers/${speakerId}/photo`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const updated = await response.json();
    // Actualizar UI con updated.person.avatar
  };

  const handleDelete = async () => {
    await fetch(`/api/speakers/${speakerId}/photo`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    // Actualizar UI eliminando la foto
  };

  return (
    <div>
      {currentPhotoUrl && <img src={currentPhotoUrl} />}
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {currentPhotoUrl && <button onClick={handleDelete}>Eliminar</button>}
    </div>
  );
};
```

### Flujo 2: Creación Masiva de Invitaciones

```typescript
// 2. Componente para crear invitaciones masivas
const BulkInvitationCreator = ({ eventId, sponsorId }) => {
  const [quantity, setQuantity] = useState(10);
  const [participantType, setParticipantType] = useState('GUEST');

  const handleCreate = async () => {
    const response = await fetch(
      `/api/events/${eventId}/sponsors/${sponsorId}/invitations/bulk`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity,
          participantType,
          expiresAt: '2025-12-31T23:59:59Z'
        })
      }
    );

    const result = await response.json();

    // Mostrar resultado
    console.log(`✅ ${result.created} invitaciones creadas`);
    console.log(`Cuota restante: ${result.limits.remaining}`);

    // Descargar códigos como CSV o mostrar en tabla
    const codes = result.invitations.map(inv => inv.code);
  };

  return (
    <div>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min={1}
        max={100}
      />
      <select
        value={participantType}
        onChange={(e) => setParticipantType(e.target.value)}
      >
        <option value="STAFF">Staff</option>
        <option value="GUEST">Invitado</option>
        <option value="SCHOLARSHIP">Beca</option>
        <option value="OPERATIONAL_STAFF">Staff Operacional</option>
      </select>
      <button onClick={handleCreate}>Crear Invitaciones</button>
    </div>
  );
};
```

### Flujo 3: Registro Masivo por Admin

```typescript
// 3. Componente para registrar usuarios en evento
const BulkRegistration = ({ invitationCode, userList }) => {
  const [results, setResults] = useState([]);

  const registerUsers = async () => {
    const promises = userList.map(userId =>
      fetch(`/api/invitations/${invitationCode}/accept-for-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      .then(res => res.json())
      .then(data => ({ userId, success: true, data }))
      .catch(error => ({ userId, success: false, error: error.message }))
    );

    const registrationResults = await Promise.all(promises);
    setResults(registrationResults);

    // Mostrar resultados
    const successful = registrationResults.filter(r => r.success).length;
    console.log(`✅ ${successful}/${userList.length} usuarios registrados`);
  };

  return (
    <div>
      <button onClick={registerUsers}>
        Registrar {userList.length} usuarios
      </button>
      <ul>
        {results.map(result => (
          <li key={result.userId}>
            {result.success ? '✅' : '❌'}
            {result.success ? result.data.user.fullName : result.error}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## ⚠️ Consideraciones Importantes

### Seguridad

- Todos los endpoints (excepto públicos) requieren autenticación JWT
- Se validan roles apropiados para cada operación
- Las imágenes se validan en tamaño y tipo
- Los archivos antiguos se eliminan automáticamente

### Limitaciones

- **Creación masiva:** Máximo 100 invitaciones por request
- **Imágenes:** Validaciones de tamaño aplicadas en `StorageService`
- **Cuotas:** Se validan antes de crear invitaciones

### Mejores Prácticas

1. **Siempre manejar errores** en las peticiones
2. **Validar archivos** antes de subirlos (cliente)
3. **Mostrar progreso** en operaciones masivas
4. **Confirmar eliminaciones** de imágenes
5. **Actualizar UI** inmediatamente después de cambios

---

## 📞 Soporte

Para dudas o problemas con estos endpoints, consulta:

- Swagger UI: `/api/docs`
- Código fuente en `src/speakers/`, `src/companies/`, `src/events/`

**Última actualización:** 2026-01-10
