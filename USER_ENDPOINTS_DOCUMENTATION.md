# 📚 Documentación de Endpoints - Módulo de Usuarios

## Base URL

`/users`

## Autenticación

Todos los endpoints requieren autenticación mediante **JWT** (Header `Authorization: Bearer <token>`), salvo que se indique lo contrario. Además, se aplican validaciones de roles específicos por endpoint.

---

## 1. Registrar Nuevo Usuario (Autoregistro)

Crea un usuario junto con su perfil de persona. Ideal para formularios de registro público.

- **Método:** `POST`
- **URL:** `/users/register`
- **Roles:** Público (verificar configuración de guardias globales).

### Body (`CreateUserWithPersonDto`)

```json
{
  "firstName": "Juan", // Requerido, string (min 2, max 50)
  "lastName": "Pérez", // Requerido, string (min 2, max 50)
  "email": "juan.perez@test.com", // Requerido, email válido, único
  "password": "Password123!", // Requerido, string (min 8)
  "phone": "+51999888777", // Opcional, formato E.164
  "dateOfBirth": "1990-01-15", // Opcional, ISO 8601 Date (YYYY-MM-DD)
  "avatar": "url_to_image.jpg", // Opcional, string (URL)
  "roles": ["user"], // Opcional, array de enum: 'user', 'platform_admin', etc. (Default: ['user'])
  "companyId": "64f1..." // Opcional, MongoID (para administradores de empresa)
}
```

### Respuesta Exitosa (201 Created)

Retorna un objeto `UserDto`.

---

## 2. Crear Usuario (Solo Admin)

Permite a un administrador crear un usuario vinculándolo explícitamente a una persona existente.

- **Método:** `POST`
- **URL:** `/users`
- **Roles:** `platform_admin`

### Body (`CreateUserDto`)

Hereda los campos de registro, pero requiere `personId` si se desea vincular a una persona ya existente, o crea una nueva si se envían los datos personales.

```json
{
  "personId": "64f14b1a2c4e5a1234567890" // Requerido si se vincula, MongoID
  // ... más los campos de CreateUserWithPersonDto (firstName, lastName, etc.)
}
```

### Respuesta Exitosa (201 Created)

Retorna un objeto `UserDto`.

---

## 3. Obtener Todos los Usuarios

Listado paginado con filtros avanzados.

- **Método:** `GET`
- **URL:** `/users`
- **Roles:** `platform_admin`, `company_admin`

### Query Params (`UserFilterDto`)

| Parámetro | Tipo | Descripción | Ejemplo |
|Data | Data | Data | Data|
|---|---|---|---|
| `page` | number | Número de página (default: 1) | `1` |
| `limit` | number | Items por página (default: 10) | `10` |
| `search` | string | Búsqueda por texto (nombre, email) | `juan` |
| `role` | enum | Filtrar por rol (`user`, `platform_admin`, etc.) | `user` |
| `companyId` | string | Filtrar por ID de empresa (MongoID) | `64f1...` |
| `emailVerified`| boolean| Filtrar por estado de email | `true` |
| `entityStatus` | enum | Estado de entidad (`active`, `inactive`) | `active` |
| `createdFrom` | date | Fecha creación desde (YYYY-MM-DD) | `2023-01-01` |
| `createdTo` | date | Fecha creación hasta (YYYY-MM-DD) | `2023-12-31` |

### Respuesta Exitosa (200 OK)

Retorna un objeto `UserPaginatedDto` (lista de usuarios + metadata).

---

## 4. Obtener Usuario por ID

- **Método:** `GET`
- **URL:** `/users/:id`
- **Roles:** `platform_admin`, `company_admin`, `user`

### Parámetros

- `id`: MongoID del usuario.

### Respuesta Exitosa (200 OK)

Retorna un objeto `UserDto`.

---

## 5. Actualizar Usuario

Actualiza datos del usuario o su información personal asociada.

- **Método:** `PATCH`
- **URL:** `/users/:id`
- **Roles:** `platform_admin`, `user`

### Body (`UpdateUserDto`)

Todos los campos son opcionales. No permite actualizar contraseña directamente aquí (usar flujo de auth).

```json
{
  "firstName": "Juan Modificado",
  "phone": "+51900000000",
  "avatar": "new_url.jpg"
}
```

### Respuesta Exitosa (200 OK)

Retorna el objeto `UserDto` actualizado.

---

## 6. Cambiar Estado del Usuario

Activar o desactivar usuarios (suspensión o soft delete lógico).

- **Método:** `PATCH`
- **URL:** `/users/:id/status`
- **Roles:** `platform_admin`

### Body (`StatusDto`)

```json
{
  "entityStatus": "active" // Valores posibles: "active", "inactive", "deleted", "archived"
}
```

### Respuesta Exitosa (200 OK)

Retorna el objeto `UserDto` actualizado.

---

## 7. Verificar Email (Manual)

Fuerza la marca de verificación del correo de un usuario.

- **Método:** `PATCH`
- **URL:** `/users/:id/verify-email`
- **Roles:** Autenticado.

### Respuesta Exitosa (200 OK)

Retorna el objeto `UserDto` con `emailVerified: true`.

---

## 8. Eliminar Usuario (Soft Delete)

Eliminación lógica del sistema (marca `deletedAt`).

- **Método:** `DELETE`
- **URL:** `/users/:id`
- **Roles:** `platform_admin`

### Respuesta Exitosa (204 No Content)

Sin cuerpo de respuesta.

---

## 9. Obtener Mis Roles de Staff

Retorna información sobre si el usuario actual tiene roles de staff operativo o staff de sponsor en eventos.

- **Método:** `GET`
- **URL:** `/users/me/staff-roles`
- **Roles:** `user`, `platform_admin`, `company_admin`

### Respuesta Exitosa (200 OK)

```json
{
  "hasStaffRoles": true,
  "operationalStaff": [
    {
      "eventId": "64f1...",
      "eventTitle": "Conferencia Tech 2025",
      "role": "access_control",
      "canAccess": true
    }
  ],
  "sponsorStaff": [
    {
      "eventId": "64f1...",
      "sponsorId": "64f2...",
      "sponsorName": "Acme Corp",
      "role": "representative",
      "canAccess": true
    }
  ]
}
```

---

## Modelos de Datos Comunes

### UserDto

```json
{
  "id": "64f14b1a2c4e5a1234567890",
  "email": "juan.perez@example.com",
  "roles": ["user"],
  "person": {
    "id": "64f1...",
    "firstName": "Juan",
    "lastName": "Pérez",
    "fullName": "Juan Pérez",
    "phone": "+51999888777",
    "avatar": "url...",
    "type": "user_person"
  },
  "company": {
    "id": "...",
    "name": "Empresa X"
  },
  "entityStatus": "active",
  "emailVerified": true,
  "createdAt": "2023-01-01T12:00:00.000Z",
  "updatedAt": "2023-01-02T15:30:00.000Z"
}
```
