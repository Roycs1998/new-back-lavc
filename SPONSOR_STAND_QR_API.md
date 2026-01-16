# Sponsor Stand QR API Documentation

Este documento detalla los endpoints y flujos para el sistema de visitas a stands de sponsors mediante códigos QR.

## Flujos Soportados

1.  **Usuario escanea Sponsor (cámara del celular):**
    - El stand muestra un código QR que es en realidad un **link a la web**.
    - El usuario escanea con la cámara del celular y se abre el navegador en la ruta de tu frontend.
    - Esa pantalla muestra algo como “Gracias por visitar nuestro stand” y, en automático, llama al backend para registrar la visita.
2.  **Staff escanea Usuario (app / web interna):**
    - Un miembro del staff del sponsor utiliza la app en modo staff para escanear el QR del ticket del asistente.
    - Se registra la visita usando el QR del ticket (igual que antes).

---

## Endpoints

Base URL: `/api/sponsor-stands` (asumiendo prefijo global `/api`)

### 1. Generar LINK para QR de Stand
**Uso:** El administrador de la empresa o staff genera el **link** que se usará para construir el código QR físico del stand.

-   **URL:** `POST /sponsor-stands/:sponsorId/qr/generate`
-   **Auth:** Bearer Token (Staff o Admin del Sponsor)
-   **Respuesta:**
    ```json
    {
      "url": "https://web.tuevento.com/sponsor-stands/visit/66c0da2b6a3aa6ed3c63e004",
      "sponsorId": "66c0da2b6a3aa6ed3c63e004",
      "eventId": "66c0da2b6a3aa6ed3c63e001",
      "companyName": "Tech Corp"
    }
    ```

> El dominio base del link se obtiene de la variable de entorno `WEB_APP_URL` (ej: `https://web.tuevento.com`).  
> El path sugerido es `/sponsor-stands/visit/:sponsorId`, pero puedes mapearlo a la ruta que más te convenga en tu frontend.

### 2. Registrar Visita (Usuario -> Sponsor)
**Uso:** Cuando el usuario ya abrió la web (desde el link del QR del stand) y quieres registrar la visita en el backend.

-   **URL:** `POST /sponsor-stands/:sponsorId/scan-sponsor`
-   **Auth:** Bearer Token (Usuario Autenticado)
-   **Body:**
    ```json
    {
      "sponsorId": "66c0da2b6a3aa6ed3c63e004",
      "deviceInfo": { "os": "iOS", "version": "17.2" },
      "location": { "latitude": -12.04, "longitude": -77.04 }
    }
    ```
-   **Response:** `SponsorStandVisitDto`

### 3. Registrar Visita (Staff -> Usuario)
**Uso:** Cuando el staff del sponsor escanea el ticket de un asistente.

-   **URL:** `POST /sponsor-stands/:sponsorId/scan-attendee`
-   **Auth:** Bearer Token (Staff del Sponsor)
-   **Body:**
    ```json
    {
      "qrCode": "eyJhbGciOiJIUzI1NiIsIn...", // El string completo del QR del ticket
      "deviceInfo": { "os": "Android", "version": "14" },
      "location": { "latitude": -12.04, "longitude": -77.04 }
    }
    ```
-   **Response:** `SponsorStandVisitDto`

### 4. Obtener Historial de Visitas (Vista Sponsor)
**Uso:** Ver quiénes han visitado el stand.

-   **URL:** `GET /sponsor-stands/:sponsorId/visits`
-   **Auth:** Bearer Token (Staff/Admin del Sponsor)
-   **Response:** Array de `SponsorStandVisitDto`

### 5. Mis Visitas (Vista Usuario)
**Uso:** Ver qué stands ha visitado el usuario actual.

-   **URL:** `GET /sponsor-stands/my-visits`
-   **Auth:** Bearer Token (Cualquier usuario)
-   **Response:** Array de `SponsorStandVisitDto`

---

## Tipos TypeScript (Frontend)

Copia estos tipos para usarlos en tu frontend.

```typescript
// DTOs de Request
export interface ScanSponsorQRPayload {
  sponsorId: string;
  deviceInfo?: Record<string, unknown>;
  location?: { latitude: number; longitude: number };
}

export interface ScanAttendeeQRPayload {
  qrCode: string;
  deviceInfo?: Record<string, unknown>;
  location?: { latitude: number; longitude: number };
}

// DTOs de Response
export interface VisitorDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SponsorDto {
  id: string;
  companyName: string;
}

export interface SponsorStandVisitDto {
  id: string;
  visitor: VisitorDto;
  sponsor: SponsorDto;
  scannedAt: string; // ISO Date
  scanType: 'USER_SCANS_SPONSOR' | 'SPONSOR_SCANS_ATTENDEE';
  visitCount: number;
}
```

## Ejemplos de Integración (Fetch)

```typescript
const API_URL = 'https://api.tuevento.com/api'; // Ajustar según entorno

/**
 * Usuario escanea el QR de un Stand (flujo desde el FRONT)
 * Ruta de ejemplo en tu frontend: /sponsor-stands/visit/:sponsorId
 * Al montar la pantalla, llamas a este método para registrar la visita.
 */
async function scanSponsorStand(
  token: string,
  sponsorId: string,
  deviceInfo?: Record<string, unknown>,
  location?: { latitude: number; longitude: number },
): Promise<SponsorStandVisitDto> {
  const response = await fetch(
    `${API_URL}/sponsor-stands/${sponsorId}/scan-sponsor`,
    {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sponsorId, deviceInfo, location }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error registrando visita');
  }

  return response.json();
}

/**
 * Staff escanea el Ticket de un Asistente
 */
async function scanAttendeeTicket(
  token: string,
  sponsorId: string,
  qrCodeFromTicket: string
): Promise<SponsorStandVisitDto> {
  const response = await fetch(`${API_URL}/sponsor-stands/${sponsorId}/scan-attendee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ qrCode: qrCodeFromTicket }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error registrando visita de asistente');
  }

  return response.json();
}
```
