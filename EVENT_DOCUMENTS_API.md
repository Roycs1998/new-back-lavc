# Módulo de Documentos de Eventos (`/events/{eventId}/documents`)

Este documento describe los endpoints del módulo de **Documentos de Eventos** pensando en el consumo desde el frontend. Incluye:

- Rutas y métodos HTTP
- Roles que pueden usarlos
- Parámetros (path, query, body)
- Forma de las respuestas (para modelar tus interfaces/Tipos)

> Todas las rutas de este módulo requieren autenticación con **JWT** y se asume un `Authorization: Bearer <token>`.

---

## 1. Crear requisito de documento

- **Método**: `POST`
- **Ruta**: `/events/{eventId}/documents/requirements`
- **Roles permitidos**: `PLATFORM_ADMIN`

### Request

- **Path params**:
  - `eventId: string` (ObjectId del evento)

- **Body** (`CreateEventDocumentRequirementDto`):
  ```json
  {
    "title": "Permiso municipal de funcionamiento",
    "description": "Documento emitido por la municipalidad...",
    "isRequired": true
  }
  ```

  - `title: string` (obligatorio)
  - `description?: string`
  - `isRequired?: boolean` (por defecto `true` si no se envía)

### Response

- **Status**: `201 Created`
- **Body** (`EventDocumentRequirementDto`):

  ```json
  {
    "id": "66c0da2b6a3aa6ed3c63e201",
    "eventId": "66c0da2b6a3aa6ed3c63e001",
    "title": "Permiso municipal de funcionamiento",
    "description": "Documento emitido por la municipalidad...",
    "isRequired": true,
    "isActive": true,
    "createdAt": "2025-08-01T10:00:00.000Z",
    "updatedAt": "2025-08-01T10:00:00.000Z"
  }
  ```

---

## 2. Listar requisitos de documentos de un evento

- **Método**: `GET`
- **Ruta**: `/events/{eventId}/documents/requirements`
- **Roles permitidos**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `USER`

### Request

- **Path params**:
  - `eventId: string`

### Response

- **Status**: `200 OK`
- **Body**: `EventDocumentRequirementDto[]`

  ```json
  [
    {
      "id": "66c0da2b6a3aa6ed3c63e201",
      "eventId": "66c0da2b6a3aa6ed3c63e001",
      "title": "Permiso municipal de funcionamiento",
      "description": "Documento emitido por la municipalidad...",
      "isRequired": true,
      "isActive": true,
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-01T10:00:00.000Z"
    }
  ]
  ```

---

## 3. Actualizar requisito de documento

- **Método**: `PATCH`
- **Ruta**: `/events/{eventId}/documents/requirements/{requirementId}`
- **Roles permitidos**: `PLATFORM_ADMIN`

### Request

- **Path params**:
  - `eventId: string`
  - `requirementId: string`

- **Body** (`UpdateEventDocumentRequirementDto` – todos opcionales):

  ```json
  {
    "title": "Nuevo título",
    "description": "Descripción actualizada",
    "isRequired": false
  }
  ```

### Response

- **Status**: `200 OK`
- **Body**: `EventDocumentRequirementDto` (misma forma que en creación).

---

## 4. Eliminar (desactivar) requisito de documento

- **Método**: `DELETE`
- **Ruta**: `/events/{eventId}/documents/requirements/{requirementId}`
- **Roles permitidos**: `PLATFORM_ADMIN`

### Request

- **Path params**:
  - `eventId: string`
  - `requirementId: string`

### Response

- **Status**: `200 OK`
- **Body**: vacío (`{}`) – solo indica que la operación tuvo éxito. En base de datos, el requisito se marca como `isActive: false`.

---

## 5. Resumen de documentos por sponsor (paginado)

- **Método**: `GET`
- **Ruta**: `/events/{eventId}/documents/summary`
- **Roles permitidos**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`

Sirve para ver, por cada sponsor, el estado de sus requisitos (cumplidos, pendientes, rechazados).

### Request

- **Path params**:
  - `eventId: string`

- **Query params** (`SponsorDocumentsSummaryQueryDto`):
  - `companyId?: string` → filtra por empresa específica.
  - `onlyWithIssues?: 0 | 1` → si es `1`, solo sponsors que tengan requisitos obligatorios pendientes o rechazados.
  - `page?: number` (por defecto `1`)
  - `limit?: number` (por defecto `10`, mínimo `1`, máximo `100`)

Ejemplo:

```http
GET /events/66c0da2b6a3aa6ed3c63e001/documents/summary?page=1&limit=10&onlyWithIssues=1
```

### Response

- **Status**: `200 OK`
- **Body** (`SponsorDocumentsPaginatedDto`):

  ```json
  {
    "data": [
      {
        "sponsorId": "66c0da2b6a3aa6ed3c63e004",
        "companyId": "66bfca24c3baf17b08c9b111",
        "companyName": "Acme Corp",
        "companyEmail": "contacto@acmecorp.com",
        "requirements": [
          {
            "requirementId": "66c0da2b6a3aa6ed3c63e201",
            "title": "Permiso municipal de funcionamiento",
            "isRequired": true,
            "lastStatus": "PENDING",
            "isMissingRequired": false,
            "lastSubmission": {
              "id": "66c0da2b6a3aa6ed3c63f301",
              "requirementId": "66c0da2b6a3aa6ed3c63e201",
              "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
              "companyId": "66bfca24c3baf17b08c9b111",
              "fileKey": "upload/documents/...",
              "fileUrl": "https://cdn.lavc.com/upload/documents/permiso.pdf",
              "fileName": "permiso-municipal-2025.pdf",
              "fileMimeType": "application/pdf",
              "fileSize": 524288,
              "status": "PENDING",
              "reviewerComment": null,
              "reviewedBy": null,
              "reviewedAt": null,
              "uploadedBy": "66bfca24c3baf17b08c9b555",
              "createdAt": "2025-08-04T12:00:00.000Z",
              "updatedAt": "2025-08-04T12:00:00.000Z"
            }
          }
        ],
        "missingRequiredCount": 1,
        "totalRequired": 3,
        "isCompliant": false
      }
    ],
    "totalItems": 15,
    "totalPages": 2,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
  ```

- **Enums importantes**:
  - `lastStatus` y `status` (`SponsorDocumentStatus`): valores posibles:
    - `"PENDING"`
    - `"APPROVED"`
    - `"REJECTED"`

Con esto puedes crear interfaces como:

```ts
type SponsorDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface SponsorDocumentSubmission {
  id: string;
  requirementId: string;
  eventSponsorId: string;
  companyId: string;
  fileKey: string;
  fileUrl: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  status: SponsorDocumentStatus;
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface SponsorRequirementStatus {
  requirementId: string;
  title: string;
  isRequired: boolean;
  lastStatus?: SponsorDocumentStatus;
  isMissingRequired: boolean;
  lastSubmission?: SponsorDocumentSubmission;
}

interface SponsorDocumentsBySponsor {
  sponsorId: string;
  companyId: string;
  companyName: string;
  companyEmail?: string;
  requirements: SponsorRequirementStatus[];
  missingRequiredCount: number;
  totalRequired: number;
  isCompliant: boolean;
}

interface SponsorDocumentsPaginated {
  data: SponsorDocumentsBySponsor[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

---

## 6. Subir documento para un requisito

- **Método**: `POST`
- **Ruta**: `/events/{eventId}/documents/requirements/{requirementId}/submit`
- **Roles permitidos**: `COMPANY_ADMIN`, `USER` (usuarios de empresa)

El backend infiere el sponsor usando el `companyId` que viene en el token del usuario, por lo que el usuario debe estar asociado a una empresa patrocinadora activa de ese evento.

### Request

- **Path params**:
  - `eventId: string`
  - `requirementId: string`

- **Headers**:
  - `Content-Type: multipart/form-data`

- **Body (form-data)**:
  - `file`: campo tipo archivo (clave `file`)
    - Extensiones permitidas: PDF, JPEG, PNG
    - Tamaño máximo: `10MB`

Ejemplo usando `fetch` en frontend:

```ts
const formData = new FormData();
formData.append('file', fileInput.files[0]);

await fetch(`/events/${eventId}/documents/requirements/${requirementId}/submit`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### Response

- **Status**: `201 Created`
- **Body**: `SponsorDocumentSubmissionDto` (misma forma que se muestra en la sección de resumen).

Esto te permite actualizar en frontend el estado del requisito con el último envío realizado.

---

## 7. Revisar documento (aprobar/rechazar)

- **Método**: `POST`
- **Ruta**: `/events/{eventId}/documents/submissions/{submissionId}/review`
- **Roles permitidos**: `PLATFORM_ADMIN`

### Request

- **Path params**:
  - `eventId: string`
  - `submissionId: string`

- **Body** (`ReviewSponsorDocumentDto`):

  ```json
  {
    "status": "APPROVED",
    "reviewerComment": "Todo correcto."
  }
  ```

  - `status: "PENDING" | "APPROVED" | "REJECTED"` (enum `SponsorDocumentStatus`)
  - `reviewerComment?: string` (recomendado si `status` es `"REJECTED"`)

### Response

- **Status**: `200 OK`
- **Body**: `SponsorDocumentSubmissionDto` actualizado, por ejemplo:

  ```json
  {
    "id": "66c0da2b6a3aa6ed3c63f301",
    "requirementId": "66c0da2b6a3aa6ed3c63e201",
    "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
    "companyId": "66bfca24c3baf17b08c9b111",
    "fileKey": "upload/documents/...",
    "fileUrl": "https://cdn.lavc.com/upload/documents/permiso.pdf",
    "fileName": "permiso-municipal-2025.pdf",
    "fileMimeType": "application/pdf",
    "fileSize": 524288,
    "status": "APPROVED",
    "reviewerComment": "Todo correcto.",
    "reviewedBy": "66bfca24c3baf17b08c9b999",
    "reviewedAt": "2025-08-05T09:30:00.000Z",
    "uploadedBy": "66bfca24c3baf17b08c9b555",
    "createdAt": "2025-08-04T12:00:00.000Z",
    "updatedAt": "2025-08-05T09:30:00.000Z"
  }
  ```

---

## 8. Resumen rápido de interfaces sugeridas para el frontend

Además de los tipos mostrados arriba, puedes modelar los DTOs de requisitos así:

```ts
interface EventDocumentRequirement {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Con este documento deberías poder montar rápidamente:

- Pantalla de gestión de requisitos de documentos (admin plataforma).
- Pantalla de subida de documentos para sponsors.
- Panel de seguimiento de cumplimiento por sponsor.

