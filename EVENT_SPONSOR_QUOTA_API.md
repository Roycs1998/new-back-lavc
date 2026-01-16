# Módulo de Solicitudes de Cupo de Patrocinadores (`/event-sponsors/{eventId}/quota-requests`)

Este documento describe los endpoints del flujo de **solicitud y aprobación de nuevas cuotas** para patrocinadores de eventos, pensando en el consumo desde el frontend. Incluye:

- Rutas y métodos HTTP
- Roles que pueden usarlos
- Parámetros (path, query, body)
- Forma de las respuestas (para modelar tus interfaces/tipos)

> Todas las rutas de este módulo requieren autenticación con **JWT** y se asume un `Authorization: Bearer <token>`.

---

## 1. Crear solicitud de aumento de cupo

- **Método**: `POST`
- **Ruta**: `/event-sponsors/{eventId}/quota-requests`
- **Roles permitidos**: `COMPANY_ADMIN`

Sirve para que una empresa patrocinadora pida más cupos para su staff, invitados o becados en un evento específico. El backend identifica el `EventSponsor` usando `companyId` del usuario actual y el `eventId` del path.

### Request

- **Path params**:
  - `eventId: string` (ObjectId del evento)

- **Body** (`CreateQuotaRequestDto`):

  ```json
  {
    "type": "STAFF",
    "requestedAmount": 5,
    "reason": "Necesitamos más personal para el registro de asistentes."
  }
  ```

  - `type: "STAFF" | "GUEST" | "SCHOLARSHIP"` (enum `ParticipantType`)
  - `requestedAmount: number` (entero > 0)
  - `reason: string` (motivo obligatorio, texto libre)

### Response

- **Status**: `201 Created`
- **Body** (`QuotaRequestDto`):

  ```json
  {
    "id": "66c0da2b6a3aa6ed3c63e005",
    "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
    "type": "STAFF",
    "requestedAmount": 5,
    "reason": "Necesitamos más personal para el registro de asistentes.",
    "status": "PENDING",
    "approvedAmount": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "rejectionReason": null,
    "createdAt": "2025-08-10T10:00:00.000Z"
  }
  ```

---

## 2. Listar solicitudes de cupo de un evento

- **Método**: `GET`
- **Ruta**: `/event-sponsors/{eventId}/quota-requests`
- **Roles permitidos**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`

Sirve para ver todas las solicitudes de aumento de cupo de un evento. Si el usuario es `COMPANY_ADMIN`, el backend debería controlar a nivel de negocio que solo pueda ver las que le correspondan o aplicar lógica de autorización adicional según se requiera.

### Request

- **Path params**:
  - `eventId: string`

- **Query params**:
  - `status?: "PENDING" | "APPROVED" | "REJECTED"` (enum `QuotaRequestStatus`)

Ejemplos:

```http
GET /event-sponsors/66c0da2b6a3aa6ed3c63e001/quota-requests
GET /event-sponsors/66c0da2b6a3aa6ed3c63e001/quota-requests?status=PENDING
```

### Response

- **Status**: `200 OK`
- **Body**: `QuotaRequestDto[]`

```json
[
  {
    "id": "66c0da2b6a3aa6ed3c63e005",
    "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
    "type": "STAFF",
    "requestedAmount": 5,
    "reason": "Necesitamos más personal.",
    "status": "PENDING",
    "approvedAmount": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "rejectionReason": null,
    "createdAt": "2025-08-10T10:00:00.000Z"
  },
  {
    "id": "66c0da2b6a3aa6ed3c63e006",
    "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
    "type": "GUEST",
    "requestedAmount": 10,
    "reason": "Más invitados VIP.",
    "status": "APPROVED",
    "approvedAmount": 8,
    "reviewedBy": "66bfca24c3baf17b08c9b999",
    "reviewedAt": "2025-08-11T09:30:00.000Z",
    "rejectionReason": null,
    "createdAt": "2025-08-10T11:00:00.000Z"
  }
]
```

---

## 3. Listar las solicitudes de mi empresa (por evento)

- **Método**: `GET`
- **Ruta**: `/event-sponsors/{eventId}/my-quota-requests`
- **Roles permitidos**: `COMPANY_ADMIN`

Devuelve solo las solicitudes de cupo realizadas por la empresa del usuario actual para ese evento.

### Request

- **Path params**:
  - `eventId: string`

### Response

- **Status**: `200 OK`
- **Body**: `QuotaRequestDto[]` (misma forma que en la sección anterior), por ejemplo:

```json
[
  {
    "id": "66c0da2b6a3aa6ed3c63e005",
    "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
    "type": "STAFF",
    "requestedAmount": 5,
    "reason": "Necesitamos más personal.",
    "status": "PENDING",
    "approvedAmount": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "rejectionReason": null,
    "createdAt": "2025-08-10T10:00:00.000Z"
  }
]
```

---

## 4. Revisar solicitud de cupo (aprobar/rechazar)

- **Método**: `PATCH`
- **Ruta**: `/event-sponsors/{eventId}/quota-requests/{requestId}/review`
- **Roles permitidos**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`

Permite aprobar o rechazar una solicitud de aumento de cupo. Si se aprueba, el backend actualiza automáticamente las cuotas del `EventSponsor` (staffQuota, guestQuota o scholarshipQuota). Si se rechaza, se guarda el motivo.

### Request

- **Path params**:
  - `eventId: string`
  - `requestId: string`

- **Body** (`ReviewQuotaRequestDto`):

  ```json
  {
    "status": "APPROVED",
    "approvedAmount": 8
  }
  ```

  o para rechazo:

  ```json
  {
    "status": "REJECTED",
    "rejectionReason": "No hay capacidad suficiente en el venue."
  }
  ```

  - `status: "APPROVED" | "REJECTED"` (no se puede volver a `PENDING`)
  - `approvedAmount?: number` (solo tiene sentido si `status` es `"APPROVED"`)
    - Si no se envía, se usa `requestedAmount`.
  - `rejectionReason?: string` (recomendado/esperado si `status` es `"REJECTED"`)

### Response

- **Status**: `200 OK`
- **Body**: `QuotaRequestDto` actualizado

```json
{
  "id": "66c0da2b6a3aa6ed3c63e006",
  "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
  "type": "GUEST",
  "requestedAmount": 10,
  "reason": "Más invitados VIP.",
  "status": "APPROVED",
  "approvedAmount": 8,
  "reviewedBy": "66bfca24c3baf17b08c9b999",
  "reviewedAt": "2025-08-11T09:30:00.000Z",
  "rejectionReason": null,
  "createdAt": "2025-08-10T11:00:00.000Z"
}
```

Si se intenta revisar una solicitud que ya está en estado distinto de `PENDING`, el backend devuelve un error `409 Conflict` indicando que la solicitud ya fue revisada.

---

## 5. Enums y modelos sugeridos para el frontend

### 5.1. Enums

```ts
export type ParticipantType = 'STAFF' | 'GUEST' | 'SCHOLARSHIP';

export type QuotaRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
```

### 5.2. Payloads de entrada

```ts
export interface CreateQuotaRequestPayload {
  type: ParticipantType;
  requestedAmount: number;
  reason: string;
}

export interface ReviewQuotaRequestPayload {
  status: Extract<QuotaRequestStatus, 'APPROVED' | 'REJECTED'>;
  approvedAmount?: number; // solo cuando status === 'APPROVED'
  rejectionReason?: string; // recomendado cuando status === 'REJECTED'
}
```

### 5.3. DTO de respuesta (`QuotaRequestDto`)

```ts
export interface QuotaRequestDto {
  id: string;
  eventSponsorId: string;
  type: ParticipantType;
  requestedAmount: number;
  reason: string;
  status: QuotaRequestStatus;
  approvedAmount?: number | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null; // ISO date
  rejectionReason?: string | null;
  createdAt: string; // ISO date
}
```

### 5.4. Ejemplos rápidos de uso en frontend

Crear solicitud:

```ts
async function createQuotaRequest(
  eventId: string,
  payload: CreateQuotaRequestPayload,
  token: string,
): Promise<QuotaRequestDto> {
  const response = await fetch(`/event-sponsors/${eventId}/quota-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Error creando solicitud de cupo');
  }

  return (await response.json()) as QuotaRequestDto;
}
```

Listar mis solicitudes:

```ts
async function getMyQuotaRequests(
  eventId: string,
  token: string,
): Promise<QuotaRequestDto[]> {
  const response = await fetch(`/event-sponsors/${eventId}/my-quota-requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error obteniendo mis solicitudes de cupo');
  }

  return (await response.json()) as QuotaRequestDto[];
}
```

Revisar una solicitud:

```ts
async function reviewQuotaRequest(
  eventId: string,
  requestId: string,
  payload: ReviewQuotaRequestPayload,
  token: string,
): Promise<QuotaRequestDto> {
  const response = await fetch(
    `/event-sponsors/${eventId}/quota-requests/${requestId}/review`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error('Error revisando solicitud de cupo');
  }

  return (await response.json()) as QuotaRequestDto;
}
```

Con este documento deberías poder:

- Modelar rápidamente los tipos en tu frontend.
- Implementar pantallas de:
  - Solicitud de aumento de cupos por parte de sponsors.
  - Listado e historial de solicitudes por empresa.
  - Panel de revisión/aprobación de solicitudes para admins de la plataforma o del evento.
