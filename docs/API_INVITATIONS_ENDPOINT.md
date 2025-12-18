# API de Invitaciones - Documentación para Frontend

## Endpoint: Listar Invitaciones de un Evento (Paginado)

### Información General

**Endpoint:** `GET /events/:eventId/invitations`

**Autenticación:** Requerida (JWT Bearer Token)

**Roles permitidos:**

- `platform_admin` - Puede ver todas las invitaciones del evento
- `company_admin` - Solo puede ver invitaciones de sponsors de su empresa

**Descripción:** Obtiene todas las invitaciones de un evento con capacidad de filtrado avanzado y paginación.

---

## Parámetros

### Path Parameters

| Parámetro | Tipo              | Requerido | Descripción   |
| --------- | ----------------- | --------- | ------------- |
| `eventId` | string (ObjectId) | ✅ Sí     | ID del evento |

**Ejemplo:** `66c0da2b6a3aa6ed3c63e001`

---

### Query Parameters (Todos Opcionales)

#### Paginación

| Parámetro   | Tipo   | Valor por Defecto | Descripción                                                |
| ----------- | ------ | ----------------- | ---------------------------------------------------------- |
| `page`      | number | `1`               | Número de página (mínimo: 1)                               |
| `limit`     | number | `10`              | Cantidad de resultados por página (mínimo: 1, máximo: 100) |
| `sortBy`    | string | `'createdAt'`     | Campo por el cual ordenar                                  |
| `sortOrder` | string | `'desc'`          | Orden de clasificación: `'asc'` o `'desc'`                 |

#### Filtros

| Parámetro          | Tipo              | Valores Posibles                                     | Descripción                                  |
| ------------------ | ----------------- | ---------------------------------------------------- | -------------------------------------------- |
| `sponsorId`        | string (ObjectId) | Cualquier ID válido                                  | Filtra invitaciones de un sponsor específico |
| `participantType`  | string (enum)     | `guest`, `staff`, `scholarship`, `operational_staff` | Filtra por tipo de participante              |
| `usageType`        | string (enum)     | `single`, `multiple`                                 | Filtra por tipo de uso de la invitación      |
| `isActive`         | boolean           | `true`, `false`                                      | Filtra por estado activo/inactivo            |
| `isExpired`        | boolean           | `true`, `false`                                      | Filtra por invitaciones expiradas/vigentes   |
| `hasAvailableUses` | boolean           | `true`, `false`                                      | Filtra por disponibilidad de usos            |

---

## Estructura de Respuesta

### Tipo de Respuesta Paginada

```typescript
interface PaginatedInvitationsResponse {
  data: SponsorInvitation[];
  meta: PaginationMeta;
}

interface PaginationMeta {
  total: number; // Total de registros que coinciden con los filtros
  page: number; // Página actual
  limit: number; // Cantidad de resultados por página
  totalPages: number; // Total de páginas disponibles
  hasNextPage: boolean; // Indica si hay una página siguiente
  hasPrevPage: boolean; // Indica si hay una página anterior
}

interface SponsorInvitation {
  id: string;
  eventSponsorId: string | null; // null si es OPERATIONAL_STAFF
  eventId: string;
  code: string; // Código único de invitación (8 caracteres)
  participantType: 'guest' | 'staff' | 'scholarship' | 'operational_staff';
  ticketTypeId: string;
  usageType: 'single' | 'multiple';
  maxUses: number | null; // null si es 'single'
  currentUses: number;
  expiresAt: string | null; // ISO 8601 date string o null
  isActive: boolean;
  createdBy: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  // Datos poblados
  ticketType: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
  };

  eventSponsor?: {
    // Solo presente si no es OPERATIONAL_STAFF
    id: string;
    eventId: string;
    companyId: string;
    staffQuota: number;
    guestQuota: number;
    scholarshipQuota: number;
    staffUsed: number;
    guestUsed: number;
    scholarshipUsed: number;
    isActive: boolean;

    // Datos de la empresa poblados
    company: {
      id: string;
      name: string;
      ruc: string;
      email: string;
      phone: string;
      address: string;
      logoUrl: string | null;
      isActive: boolean;
    };
  };

  // Campos virtuales calculados
  remainingUses?: number; // Usos restantes (si aplica)
}
```

---

## Ejemplos de Uso

### 1. Obtener Primera Página (Paginación por Defecto)

```bash
GET /events/66c0da2b6a3aa6ed3c63e001/invitations
Authorization: Bearer <jwt_token>
```

**Respuesta:**

```json
{
  "data": [
    {
      "id": "66c0da2b6a3aa6ed3c63e020",
      "eventSponsorId": "66c0da2b6a3aa6ed3c63e004",
      "eventId": "66c0da2b6a3aa6ed3c63e001",
      "code": "ABC12345",
      "participantType": "guest",
      "ticketTypeId": "66c0da2b6a3aa6ed3c63e010",
      "usageType": "multiple",
      "maxUses": 10,
      "currentUses": 3,
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "isActive": true,
      "createdBy": "66c0da2b6a3aa6ed3c63e100",
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-15T15:30:00.000Z",
      "ticketType": {
        "id": "66c0da2b6a3aa6ed3c63e010",
        "name": "General",
        "price": 50.0,
        "currency": "PEN"
      },
      "eventSponsor": {
        "id": "66c0da2b6a3aa6ed3c63e004",
        "company": {
          "id": "66c0da2b6a3aa6ed3c63e200",
          "name": "ACME Corp",
          "ruc": "20123456789",
          "logoUrl": "https://storage.example.com/logos/acme.png"
        }
      },
      "remainingUses": 7
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Paginación Personalizada

```bash
GET /events/66c0da2b6a3aa6ed3c63e001/invitations?page=2&limit=20
```

**Respuesta:**

```json
{
  "data": [
    /* 20 invitaciones */
  ],
  "meta": {
    "total": 45,
    "page": 2,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

### 3. Ordenamiento Personalizado

```bash
GET /events/66c0da2b6a3aa6ed3c63e001/invitations?sortBy=code&sortOrder=asc
```

---

### 4. Filtrar Solo Invitaciones Activas

```bash
GET /events/66c0da2b6a3aa6ed3c63e001/invitations?isActive=true&page=1&limit=15
```

---

### 5. Combinación de Filtros

```bash
GET /events/66c0da2b6a3aa6ed3c63e001/invitations?participantType=guest&isActive=true&hasAvailableUses=true&page=1&limit=25&sortBy=createdAt&sortOrder=desc
```

---

## Implementación en Frontend

### Tipos TypeScript Completos

```typescript
// Tipos de paginación
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Filtros de invitaciones
interface InvitationFilters {
  // Paginación
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Filtros
  sponsorId?: string;
  participantType?: 'guest' | 'staff' | 'scholarship' | 'operational_staff';
  usageType?: 'single' | 'multiple';
  isActive?: boolean;
  isExpired?: boolean;
  hasAvailableUses?: boolean;
}

// Invitación individual
interface SponsorInvitation {
  id: string;
  eventSponsorId: string | null;
  eventId: string;
  code: string;
  participantType: string;
  ticketTypeId: string;
  usageType: string;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  ticketType: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  eventSponsor?: {
    id: string;
    company: {
      id: string;
      name: string;
      ruc: string;
      logoUrl: string | null;
    };
  };
  remainingUses?: number;
}

// Respuesta paginada
interface PaginatedInvitationsResponse {
  data: SponsorInvitation[];
  meta: PaginationMeta;
}
```

---

### Servicio con Axios (TypeScript)

```typescript
import axios from 'axios';

class InvitationsService {
  private baseUrl = 'https://api.example.com';

  async getEventInvitations(
    eventId: string,
    filters?: InvitationFilters,
  ): Promise<PaginatedInvitationsResponse> {
    const response = await axios.get<PaginatedInvitationsResponse>(
      `${this.baseUrl}/events/${eventId}/invitations`,
      {
        params: filters,
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      },
    );

    return response.data;
  }

  private getToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

// Uso
const service = new InvitationsService();

// Ejemplo 1: Primera página con valores por defecto
const page1 = await service.getEventInvitations('66c0da2b6a3aa6ed3c63e001');
console.log(
  `Mostrando ${page1.data.length} de ${page1.meta.total} invitaciones`,
);

// Ejemplo 2: Página específica con filtros
const filtered = await service.getEventInvitations('66c0da2b6a3aa6ed3c63e001', {
  page: 2,
  limit: 20,
  participantType: 'guest',
  isActive: true,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// Ejemplo 3: Navegar a la siguiente página
if (page1.meta.hasNextPage) {
  const page2 = await service.getEventInvitations('66c0da2b6a3aa6ed3c63e001', {
    page: page1.meta.page + 1,
    limit: page1.meta.limit,
  });
}
```

---

### Hook de React Query con Paginación

```typescript
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import axios from 'axios';

function useEventInvitations(
  eventId: string,
  initialFilters?: InvitationFilters,
) {
  const [filters, setFilters] = useState<InvitationFilters>(
    initialFilters || {
      page: 1,
      limit: 10,
    },
  );

  const query = useQuery({
    queryKey: ['invitations', eventId, filters],
    queryFn: async () => {
      const { data } = await axios.get<PaginatedInvitationsResponse>(
        `/events/${eventId}/invitations`,
        {
          params: filters,
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return data;
    },
    enabled: !!eventId,
    keepPreviousData: true, // Mantener datos anteriores mientras carga
  });

  // Funciones de navegación
  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const nextPage = () => {
    if (query.data?.meta.hasNextPage) {
      goToPage((query.data.meta.page || 1) + 1);
    }
  };

  const prevPage = () => {
    if (query.data?.meta.hasPrevPage) {
      goToPage((query.data.meta.page || 1) - 1);
    }
  };

  const updateFilters = (newFilters: Partial<InvitationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset a página 1
  };

  return {
    ...query,
    filters,
    setFilters,
    updateFilters,
    goToPage,
    nextPage,
    prevPage,
  };
}
```

---

### Componente React Completo

```typescript
import React from 'react';

function InvitationsList({ eventId }: { eventId: string }) {
  const {
    data,
    isLoading,
    error,
    filters,
    updateFilters,
    nextPage,
    prevPage,
    goToPage
  } = useEventInvitations(eventId);

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error al cargar invitaciones</div>;
  if (!data) return null;

  return (
    <div className="invitations-container">
      {/* Filtros */}
      <div className="filters">
        <select
          value={filters.participantType || ''}
          onChange={(e) => updateFilters({
            participantType: e.target.value as any || undefined
          })}
        >
          <option value="">Todos los tipos</option>
          <option value="guest">Invitados</option>
          <option value="staff">Staff</option>
          <option value="scholarship">Becados</option>
        </select>

        <select
          value={filters.limit || 10}
          onChange={(e) => updateFilters({ limit: Number(e.target.value) })}
        >
          <option value="10">10 por página</option>
          <option value="25">25 por página</option>
          <option value="50">50 por página</option>
          <option value="100">100 por página</option>
        </select>

        <select
          value={filters.isActive?.toString() || ''}
          onChange={(e) => updateFilters({
            isActive: e.target.value ? e.target.value === 'true' : undefined
          })}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>

      {/* Lista de invitaciones */}
      <div className="invitations-list">
        {data.data.map(invitation => (
          <div key={invitation.id} className="invitation-card">
            <h3>{invitation.code}</h3>
            <p>Tipo: {invitation.participantType}</p>
            <p>Usos: {invitation.currentUses} / {invitation.maxUses || '∞'}</p>
            <p>Estado: {invitation.isActive ? 'Activa' : 'Inactiva'}</p>
            {invitation.eventSponsor && (
              <p>Sponsor: {invitation.eventSponsor.company.name}</p>
            )}
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="pagination">
        <button
          onClick={prevPage}
          disabled={!data.meta.hasPrevPage}
        >
          ← Anterior
        </button>

        <span>
          Página {data.meta.page} de {data.meta.totalPages}
          {' '}({data.meta.total} resultados)
        </span>

        <button
          onClick={nextPage}
          disabled={!data.meta.hasNextPage}
        >
          Siguiente →
        </button>

        {/* Navegación directa a páginas */}
        <div className="page-numbers">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={page === data.meta.page ? 'active' : ''}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InvitationsList;
```

---

### Componente de Paginación Reutilizable

```typescript
interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasPrevPage, hasNextPage, total } = meta;

  // Generar array de números de página para mostrar
  const getPageNumbers = () => {
    const delta = 2; // Páginas a mostrar antes y después de la actual
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando página {page} de {totalPages} ({total} resultados totales)
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="pagination-button"
        >
          ← Anterior
        </button>

        {getPageNumbers().map((pageNum, index) => (
          typeof pageNum === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(pageNum)}
              className={`pagination-button ${pageNum === page ? 'active' : ''}`}
            >
              {pageNum}
            </button>
          ) : (
            <span key={index} className="pagination-dots">
              {pageNum}
            </span>
          )
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="pagination-button"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// Uso
<Pagination
  meta={data.meta}
  onPageChange={(page) => updateFilters({ page })}
/>
```

---

### Ejemplo con Scroll Infinito

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

function InfiniteInvitationsList({ eventId }: { eventId: string }) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['invitations-infinite', eventId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axios.get<PaginatedInvitationsResponse>(
        `/events/${eventId}/invitations`,
        {
          params: { page: pageParam, limit: 20 },
          headers: { Authorization: `Bearer ${getToken()}` }
        }
      );
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });

  // Cargar más cuando el elemento de referencia esté visible
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.data.map(invitation => (
            <div key={invitation.id} className="invitation-card">
              <h3>{invitation.code}</h3>
              <p>{invitation.participantType}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Elemento de referencia para detectar scroll */}
      <div ref={ref} className="load-more-trigger">
        {isFetchingNextPage && <div>Cargando más...</div>}
      </div>
    </div>
  );
}
```

---

## Casos de Uso Comunes

### 1. Dashboard con Tabla Paginada

```typescript
function InvitationsDashboard({ eventId }: { eventId: string }) {
  const { data, filters, updateFilters } = useEventInvitations(eventId, {
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  return (
    <div>
      <h1>Invitaciones del Evento</h1>

      {data && (
        <div className="summary">
          <p>Total de invitaciones: {data.meta.total}</p>
          <p>Mostrando: {data.data.length} en esta página</p>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Tipo</th>
            <th>Usos</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map(inv => (
            <tr key={inv.id}>
              <td>{inv.code}</td>
              <td>{inv.participantType}</td>
              <td>{inv.currentUses} / {inv.maxUses || '∞'}</td>
              <td>{inv.isActive ? 'Activa' : 'Inactiva'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data && (
        <Pagination
          meta={data.meta}
          onPageChange={(page) => updateFilters({ page })}
        />
      )}
    </div>
  );
}
```

---

### 2. Filtrado por Sponsor

```typescript
function SponsorInvitations({ eventId, sponsorId }: Props) {
  const { data } = useEventInvitations(eventId, {
    sponsorId,
    isActive: true,
    page: 1,
    limit: 50
  });

  return (
    <div>
      <h2>Invitaciones del Sponsor</h2>
      {/* Renderizar invitaciones */}
    </div>
  );
}
```

---

### 3. Invitaciones Disponibles

```typescript
function AvailableInvitations({ eventId }: { eventId: string }) {
  const { data } = useEventInvitations(eventId, {
    isActive: true,
    hasAvailableUses: true,
    sortBy: 'expiresAt',
    sortOrder: 'asc'
  });

  return (
    <div>
      <h2>Invitaciones Disponibles</h2>
      <p>Total: {data?.meta.total || 0}</p>
      {/* Lista de invitaciones */}
    </div>
  );
}
```

---

## Códigos de Estado HTTP

| Código | Descripción                                                    |
| ------ | -------------------------------------------------------------- |
| `200`  | OK - Invitaciones obtenidas exitosamente                       |
| `400`  | Bad Request - Parámetros inválidos (ej: page < 1, limit > 100) |
| `401`  | Unauthorized - Token inválido o ausente                        |
| `403`  | Forbidden - Usuario no tiene permisos                          |
| `404`  | Not Found - Evento no encontrado                               |
| `500`  | Internal Server Error - Error del servidor                     |

---

## Notas Importantes

### Seguridad y Permisos

1. **PLATFORM_ADMIN**: Puede ver todas las invitaciones del evento sin restricciones.

2. **COMPANY_ADMIN**: Solo puede ver invitaciones de sponsors que pertenecen a su empresa. Esta restricción se aplica automáticamente en el backend.

3. Si un `COMPANY_ADMIN` intenta filtrar por un `sponsorId` que no pertenece a su empresa, no recibirá resultados (no se lanza error, simplemente retorna array vacío).

### Paginación

- **Valores por defecto**: `page=1`, `limit=10`
- **Límite máximo**: 100 resultados por página
- **Página mínima**: 1
- El contador `total` en `meta` refleja el total de registros que coinciden con los filtros, no el total absoluto de invitaciones

### Ordenamiento

- **Campo por defecto**: `createdAt`
- **Orden por defecto**: `desc` (más recientes primero)
- **Campos ordenables**: Cualquier campo de la invitación (ej: `code`, `createdAt`, `currentUses`, etc.)

### Campos Calculados

- `remainingUses`: Se calcula como `maxUses - currentUses` (solo para invitaciones múltiples)
- Si `usageType === 'single'`, `maxUses` será `null`
- Si `expiresAt` es `null`, la invitación no tiene fecha de expiración

### Validaciones

- Los valores booleanos en query params se convierten automáticamente
- Los IDs deben ser ObjectIds válidos de MongoDB (24 caracteres hexadecimales)
- Los enums deben coincidir exactamente con los valores permitidos

---

## Performance y Optimización

### Recomendaciones

1. **Usar `keepPreviousData`** en React Query para evitar estados de carga al cambiar de página
2. **Implementar debounce** en filtros de búsqueda para evitar requests excesivos
3. **Cachear resultados** usando las query keys apropiadas
4. **Limitar el `limit`** a valores razonables (10-50) para mejor performance

### Ejemplo de Debounce

```typescript
import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

function InvitationsWithSearch({ eventId }: { eventId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

  // Usar debouncedSearch en los filtros
  const { data } = useEventInvitations(eventId, {
    // Aquí podrías agregar un filtro de búsqueda si lo implementas en el backend
  });

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por código..."
      />
    </div>
  );
}
```

---

## Resumen de Cambios

### Backend

**Archivos Modificados/Creados:**

1. **`src/events/dto/list-invitations-query.dto.ts`**
   - DTO con parámetros de paginación y filtros
   - Validaciones con class-validator

2. **`src/events/dto/paginated-invitations.dto.ts`**
   - DTO de respuesta paginada
   - Estructura `{ data, meta }`

3. **`src/events/sponsor-invitations.service.ts`**
   - Método `getAllInvitationsForEvent()` con paginación
   - Soporte para ordenamiento y filtros

4. **`src/events/sponsor-invitations.controller.ts`**
   - Endpoint `GET /events/:eventId/invitations`
   - Restricción automática por empresa

5. **`src/events/event-sponsors.service.ts`**
   - Método `findByCompanyId()` para restricción de acceso

6. **`src/events/events.module.ts`**
   - Registro del nuevo controlador `EventInvitationsController`

### Características Implementadas

✅ Paginación completa con metadata  
✅ Ordenamiento dinámico  
✅ 6 filtros opcionales  
✅ Restricción por empresa para COMPANY_ADMIN  
✅ Tipos TypeScript completos  
✅ Documentación exhaustiva  
✅ Ejemplos de implementación

---

## Changelog

**Versión 2.0.0** - 2025-12-15

- ✨ **[BREAKING]** Respuesta ahora es paginada con estructura `{ data, meta }`
- ✨ Agregados parámetros de paginación: `page`, `limit`
- ✨ Agregados parámetros de ordenamiento: `sortBy`, `sortOrder`
- 📝 Documentación completa con ejemplos
- 📝 Componentes reutilizables para React

**Versión 1.0.0** - 2025-12-15

- ✨ Endpoint inicial para listar invitaciones con filtros
- 🔒 Restricción automática por empresa para COMPANY_ADMIN
