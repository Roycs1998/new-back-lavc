# 📚 Flujo de Autoregistro de Empresa y Eliminación Lógica

Este documento describe exclusivamente el flujo donde un usuario se registra con su propia empresa y, posteriormente, puede eliminarla lógicamente.

---

## 1. Registro de usuario con empresa propia

- **Método:** `POST`
- **URL:** `/auth/register-with-company`
- **Auth:** Público (sin token)
- **Descripción:** Crea un usuario y una empresa en una sola llamada. El usuario queda con rol `COMPANY_ADMIN` asociado a la empresa creada y recibe un token JWT de autenticación.

### 1.1 Body (Request)

Objeto JSON con dos bloques principales: datos de usuario y datos de empresa.

```json
{
  "firstName": "Luis",
  "lastName": "García",
  "email": "luis@miempresa.com",
  "password": "Password123!",
  "phone": "+51987654321",
  "dateOfBirth": "1990-01-15",
  "company": {
    "name": "Mi Empresa SAC",
    "description": "Organizador de eventos corporativos",
    "logo": "https://cdn.example.com/logo.png",
    "website": "https://miempresa.com",
    "contactEmail": "contacto@miempresa.com",
    "contactPhone": "+51911122334",
    "address": {
      "street": "Av. Siempre Viva 123",
      "city": "Lima",
      "state": "Lima",
      "country": "Perú",
      "zipCode": "15001"
    },
    "type": "event_organizer",
    "commissionRate": 0.1,
    "settings": {
      "canUploadSpeakers": true,
      "canCreateEvents": true,
      "maxEventsPerMonth": 10
    }
  }
}
```

#### Campos de usuario

- `firstName` (string, requerido): Nombre, min 2, max 50.
- `lastName` (string, requerido): Apellido, min 2, max 50.
- `email` (string, requerido): Email único, formato válido.
- `password` (string, requerido): Mínimo 8 caracteres.
- `phone` (string, opcional).
- `dateOfBirth` (string, opcional): ISO date `YYYY-MM-DD`.

#### Campos de empresa (`company`)

Basado en `CreateCompanyDto`:

- `name` (string, requerido): Nombre comercial o razón social.
- `description` (string, opcional).
- `logo` (string, opcional): URL del logo si ya se tiene.
- `website` (string, opcional).
- `contactEmail` (string, opcional): Email de contacto principal.
- `contactPhone` (string, opcional).
- `address` (objeto, opcional):
  - `street` (string, opcional).
  - `city` (string, requerido si se envía `address`).
  - `state` (string, opcional).
  - `country` (string, requerido si se envía `address`).
  - `zipCode` (string, opcional).
- `type` (enum, opcional): Tipo de empresa (por defecto `event_organizer`).
- `commissionRate` (number, opcional): Rango `0..1` (por ejemplo `0.15` para 15%).
- `settings` (objeto, opcional):
  - `canUploadSpeakers` (boolean, opcional, default `true`).
  - `canCreateEvents` (boolean, opcional, default `true`).
  - `maxEventsPerMonth` (number, opcional).

### 1.2 Respuesta (Response)

Retorna un objeto `AuthResponseDto` con el usuario creado (incluyendo su empresa) y el token de acceso.

```json
{
  "user": {
    "id": "64f14b1a2c4e5a1234567890",
    "email": "luis@miempresa.com",
    "roles": ["company_admin"],
    "person": {
      "id": "64f1...",
      "firstName": "Luis",
      "lastName": "García",
      "fullName": "Luis García",
      "phone": "+51987654321",
      "avatar": null,
      "type": "user_person"
    },
    "company": {
      "id": "72ab...",
      "name": "Mi Empresa SAC",
      "type": "event_organizer",
      "description": "Organizador de eventos corporativos",
      "logo": "https://cdn.example.com/logo.png",
      "contactEmail": "contacto@miempresa.com",
      "contactPhone": "+51911122334",
      "address": {
        "street": "Av. Siempre Viva 123",
        "city": "Lima",
        "state": "Lima",
        "country": "Perú",
        "zipCode": "15001"
      },
      "commissionRate": 0.1,
      "settings": {
        "canUploadSpeakers": true,
        "canCreateEvents": true,
        "maxEventsPerMonth": 10
      },
      "entityStatus": "active",
      "createdAt": "2025-08-25T10:15:30.000Z"
    },
    "entityStatus": "active",
    "emailVerified": false,
    "createdAt": "2025-08-25T10:15:30.000Z",
    "updatedAt": "2025-08-25T10:15:30.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "3600s"
}
```

Con esta respuesta se puede:

- Guardar `access_token` para futuras llamadas.
- Usar `user.company.id` para dirigir al panel de la empresa recién creada.
- Saber el rol (`roles`) y estado del usuario (`entityStatus`, `emailVerified`).

### 1.3 Errores relevantes

- `400 Bad Request`:
  - Datos inválidos en usuario o empresa.
  - Mensaje genérico: `"El registro de usuario y empresa ha fallado."` o similar.
- `409 Conflict`:
  - `"Correo electrónico ya registrado"` cuando el email ya existe.

---

## 2. Eliminación lógica de empresa propia

- **Método:** `DELETE`
- **URL:** `/companies/:id`
- **Auth:** Requiere JWT (`Authorization: Bearer <token>`)
- **Roles permitidos:** `PLATFORM_ADMIN`, `COMPANY_ADMIN`
- **Descripción:** Marca una empresa como eliminada (soft delete). No borra físicamente los datos.

### 2.1 Reglas de autorización

- `PLATFORM_ADMIN`:
  - Puede eliminar cualquier empresa.
- `COMPANY_ADMIN`:
  - Solo puede eliminar la empresa cuyo `id` coincide con su `companyId`.
  - Si intenta eliminar otra empresa, recibe `403 Forbidden` con mensaje:
    - `"Solo puedes eliminar la empresa asociada a tu cuenta"`.

### 2.2 Request

#### URL

- `:id` → ID de la empresa a eliminar (string, ObjectId).

#### Headers

- `Authorization: Bearer <access_token>`

### 2.3 Efecto en la base de datos

Internamente se ejecuta un **soft delete**:

- `entityStatus` se actualiza a `DELETED`.
- Se setean:
  - `deletedAt` (fecha/hora de eliminación).
  - `deletedBy` (usuario que realizó la operación).
- Los listados estándar de empresas filtran las de estado `DELETED`, por lo que dejará de aparecer en la mayoría de vistas.

### 2.4 Respuesta

- **Éxito:** `204 No Content` (sin cuerpo).
- **Errores:**
  - `403 Forbidden` si un `COMPANY_ADMIN` intenta eliminar una empresa distinta a su `companyId`.
  - `404 Not Found` si la empresa no existe o ya estaba eliminada.

---

## 3. Resumen rápido para interfaz

1. **Pantalla de registro empresa + usuario**
   - Enviar `POST /auth/register-with-company` con datos de persona + bloque `company`.
   - Leer de la respuesta:
     - `user` (datos del usuario autenticado).
     - `user.company` (datos principales de la empresa).
     - `access_token` para almacenamiento local.

2. **Pantalla de configuración / eliminación de empresa**
   - Usar `user.company.id` como `:id` en `DELETE /companies/:id`.
   - Esperar `204` como confirmación de eliminación lógica.
   - Manejar `403` para casos donde no coincide el `companyId` del usuario.
