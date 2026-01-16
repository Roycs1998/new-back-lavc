# Event Certificates API

Este módulo permite la gestión de plantillas de certificados y la generación de certificados PDF bajo demanda para los participantes.

## Base URL
`/event-certificates`

## Endpoints

### 1. Crear Plantilla de Certificado
Crea una nueva plantilla para un evento. Se debe subir un archivo PDF base y configurar la posición del nombre.

- **URL**: `/event-certificates`
- **Method**: `POST`
- **Auth**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: Archivo PDF (Required)
  - `name`: Nombre del template (e.g., "Certificado General")
  - `eventId`: ID del evento
  - `ticketTypeIds`: Array de IDs de tipos de tickets (e.g., `["id1", "id2"]`). *Nota: Un tipo de ticket solo puede pertenecer a un template activo.*
  - `fontConfig[x]`: Posición X (número)
  - `fontConfig[y]`: Posición Y (número, desde arriba)
  - `fontConfig[size]`: Tamaño de fuente
  - `fontConfig[color]`: Color Hex (e.g., "#000000")
  - `fontConfig[fontFamily]`: (Opcional) Fuente, default "Helvetica"

### 2. Listar Plantillas de un Evento
Obtiene todas las plantillas activas de un evento.

- **URL**: `/event-certificates/event/:eventId`
- **Method**: `GET`
- **Auth**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`
- **Response**: Array de objetos `CertificateTemplateDto`.

### 3. Obtener Plantilla por ID
- **URL**: `/event-certificates/:id`
- **Method**: `GET`
- **Auth**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`

### 4. Actualizar Plantilla
Actualiza una plantilla existente. Se puede subir un nuevo PDF o cambiar la configuración.

- **URL**: `/event-certificates/:id`
- **Method**: `PATCH`
- **Auth**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`
- **Content-Type**: `multipart/form-data`
- **Body**: (Campos opcionales)
  - `file`: Nuevo archivo PDF
  - `name`: Nuevo nombre
  - `ticketTypeIds`: Nuevos tipos de tickets (valida exclusividad)
  - `fontConfig`: Objeto de configuración de fuente

### 5. Eliminar Plantilla
Realiza un borrado lógico (soft delete).

- **URL**: `/event-certificates/:id`
- **Method**: `DELETE`
- **Auth**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`

### 6. Previsualizar Certificado
Genera un PDF de prueba usando el template y un nombre ficticio ("JUAN PÉREZ"). Útil para ajustar coordenadas X/Y.

- **URL**: `/event-certificates/:id/preview`
- **Method**: `GET`
- **Auth**: `PLATFORM_ADMIN`, `COMPANY_ADMIN`
- **Response**: Archivo PDF (stream).

### 7. Descargar Certificado (Usuario Final)
Endpoint para que el participante descargue su certificado.
Valida que:
1. El usuario tenga un ticket activo para el evento.
2. El tipo de ticket tenga una plantilla asignada.
3. (Opcional/Configurable) El evento haya finalizado.

- **URL**: `/event-certificates/download/:eventId`
- **Method**: `GET`
- **Auth**: `USER`, `PLATFORM_ADMIN`, `COMPANY_ADMIN`
- **Response**: Archivo PDF (attachment).

## Notas de Implementación
- **Exclusividad**: El sistema impide asignar un mismo tipo de ticket a dos plantillas activas simultáneamente en el mismo evento.
- **Coordenadas**: La librería PDF usa coordenadas desde abajo-izquierda, pero el servicio convierte automáticamente la coordenada Y asumiendo que el frontend envía la posición desde arriba-izquierda (lo estándar en web).
- **Generación On-Demand**: Los certificados NO se guardan en disco/S3 para cada usuario. Se generan al vuelo combinando el template PDF (guardado en S3) y el nombre del usuario.
