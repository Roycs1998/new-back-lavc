# 📋 Documentación Completa: Flujo de Compra con Culqi - LAVC 2025

## 📌 Índice
1. [Visión General](#visión-general)
2. [Arquitectura Actual](#arquitectura-actual)
3. [Flujo de Usuario](#flujo-de-usuario)
4. [Componentes Frontend](#componentes-frontend)
5. [Integración Backend](#integración-backend)
6. [Análisis de Seguridad](#análisis-de-seguridad)
7. [Problemas Identificados](#problemas-identificados)
8. [Recomendaciones de Mejora](#recomendaciones-de-mejora)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Plan de Implementación](#plan-de-implementación)

---

## 🎯 Visión General

El sistema actual implementa un flujo de compra de tickets para eventos LAVC utilizando **Culqi** como pasarela de pago principal. El flujo se compone de 4 páginas principales:

1. **Ticket** - Información y selección de ticket
2. **Adicionales** - Servicios adicionales (hospedaje, memorias, etc.)
3. **Pago** - Selección de método de pago y tipo de comprobante
4. **Confirmar** - Revisión final y procesamiento del pago

---

## 🏗️ Arquitectura Actual

### Diagrama de Flujo

```mermaid
graph TD
    A[Usuario selecciona evento] --> B[/compra/ticket]
    B --> C[Guarda datos en localStorage]
    C --> D[/compra/adicionales]
    D --> E[/compra/pago]
    E --> F{Selecciona método de pago}
    F -->|CULQI| G[/compra/confirmar]
    F -->|Otros| H[Mensaje: No implementado]
    G --> I{Acepta términos?}
    I -->|No| J[Muestra advertencia]
    I -->|Sí| K[Abre Culqi Checkout]
    K --> L[Usuario ingresa datos de tarjeta]
    L --> M{Culqi valida}
    M -->|Token generado| N[Envía token al backend]
    N --> O[Backend procesa pago]
    O --> P{Pago exitoso?}
    P -->|Sí| Q[SweetAlert: Éxito]
    P -->|No| R[SweetAlert: Error]
```

### Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | Framework principal |
| **UI** | Material-UI (MUI) | Componentes de interfaz |
| **Autenticación** | NextAuth.js | Gestión de sesiones |
| **HTTP Client** | Axios | Peticiones al backend |
| **Payment Gateway** | Culqi Checkout JS | Pasarela de pago |
| **Alerts** | SweetAlert2 | Notificaciones al usuario |
| **State Management** | localStorage + useState | Persistencia de datos temporales |

---

## 👤 Flujo de Usuario

### 1️⃣ Información de Ticket
**Archivo**: [`/compra/ticket/page.tsx`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/app/%5Blang%5D/%28home%29/compra/ticket/page.tsx)

**Responsabilidades**:
- Muestra información del evento seleccionado
- Permite al usuario revisar detalles del ticket
- Navega a `/compra/adicionales`

**Datos manejados**:
```typescript
interface EventData {
  name: string           // Nombre del evento
  image: string          // URL de la imagen del evento
  place: string          // Lugar del evento
  date: string           // Fecha del evento
  ticket: string         // Tipo de ticket (ej: "NACIONAL", "EXTRANJERO")
  price: string          // Precio del ticket
  currency: string       // Moneda (PEN, USD)
  eventCode: string      // Código del evento
}
```

### 2️⃣ Selección de Método de Pago
**Archivo**: [`/compra/pago/page.tsx`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/app/%5Blang%5D/%28home%29/compra/pago/page.tsx)

**Responsabilidades**:
- Selección de tipo de comprobante (Boleta/Factura)
- Captura RUC y razón social si es factura
- Selección de método de pago
- Validación antes de continuar

**Lógica de validación**:
```typescript
const canContinue = Boolean(expandedId) && (
  docType === 'Boleta'
  || (docType === 'Factura' && invoiceData.ruc.trim() !== '' && invoiceData.companyName.trim() !== '')
);
```

**Métodos de pago disponibles**:
- **CULQI** ✅ (Implementado) - Para tickets nacionales
  - Tarjetas de crédito/débito
  - Yape
  - Múltiples bancos
- **Paypal** ❌ (No implementado) - Para tickets extranjeros
- **NIUBIZ** ❌ (No implementado)
- **PagoEfectivo** ❌ (No implementado)

**Datos actualizados en localStorage**:
```typescript
const updatedEventData = {
  ...event,
  paymentMethod: expandedId,      // "CULQI", "Paypal", etc.
  typeOfPayment: docType,          // "Boleta" o "Factura"
  ruc: invoiceData.ruc || '',
  companyName: invoiceData.companyName || ''
}
```

### 3️⃣ Confirmación y Pago
**Archivo**: [`/compra/confirmar/page.tsx`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/app/%5Blang%5D/%28home%29/compra/confirmar/page.tsx)

**Responsabilidades**:
- Muestra resumen de la compra
- Requiere aceptación de términos y condiciones
- Inicia el proceso de pago con Culqi
- Maneja redirección si no hay sesión

**Protección de ruta**:
```typescript
useEffect(() => {
  const delayRedirect = setTimeout(() => {
    if (!session) {
      route.push('/');
    }
  }, 2000);
  return () => clearTimeout(delayRedirect);
}, [session, route]);
```

**Estado del componente**:
```typescript
const [eventData, setEventData] = useState<{
  name: string
  image: string
  place: string
  date: string
  ticket: string
  price: string
  currency: string
  paymentMethod: string
  eventType: string
  typeOfPayment: string
  ruc: string
  companyName: string
  eventCode: string
}>({ /* valores por defecto */ })

const [allSelected, setAllSelected] = useState(false) // Términos aceptados
```

**Flujo de aceptación**:
1. Usuario debe marcar checkboxes de términos y condiciones
2. `allSelected` cambia a `true`
3. Se habilita el botón "CONTINUAR"
4. Al hacer clic, se ejecuta `handlerClickOpenPay()`

---

## 🧩 Componentes Frontend

### 1. PaymentMethod Component
**Archivo**: [`PaymentMethod.tsx`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/components/components-home/components-buys/components-pay/PaymentMethod/PaymentMethod.tsx)

**Propósito**: Accordion expandible para seleccionar métodos de pago

**Props**:
```typescript
interface AveragePaymentData {
  image: string                           // Logo del método de pago
  name: string                            // Nombre (ej: "CULQI")
  paymentInstitutions: string             // Descripción breve
  description: string                     // Descripción detallada
  informationOne?: string                 // Info adicional 1
  informationTwo?: string                 // Info adicional 2
  paymentTypeImage?: string               // Imagen del tipo de pago
  listOfPaymentEntities?: PaymentInstitutions[]  // Logos de bancos
  informationThree?: string               // Info adicional 3
  id: string                              // ID único ("CULQI", "Paypal")
  expandedId: string | null               // ID del método expandido
  onChange: (id: string) => void          // Callback al seleccionar
}
```

**Comportamiento**:
- Solo un método puede estar expandido a la vez
- Muestra checkmark verde cuando está seleccionado
- Cambia borde a color primario cuando está activo

---

### 2. ConfirmPayment Component
**Archivo**: [`ConfirmPayment.tsx`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/components/components-home/components-buys/components-confirm/confirm-payment/ConfirmPayment.tsx)

**Propósito**: Tarjeta resumen que inicia el pago

**Props**:
```typescript
interface EventInformation {
  image: string
  eventLocation: string
  eventDate: string
  eventName: string
  disableButton?: boolean
  amount: number
  typeOfPayment: string
  currency: string
  email: string
  userCode: string
  eventCode: string
  paymentMethod: string
  companyName: string
  ruc: string
}
```

**Función principal**:
```typescript
const handlerClickOpenPay = () => {
  console.log("data pay", email)
  CheckPaymentGateway(
    eventName || 'Sin Asignar',
    amount,
    typeOfPayment,
    setAlertMessage,
    currency,
    email,
    userCode,
    eventCode,
    paymentMethod,
    companyName,
    ruc
  )
}
```

---

### 3. CheckPaymentGateway Function
**Archivo**: [`PaymentGateway.ts`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/components/components-home/components-buys/components-confirm/confirm-payment/PaymentGateway.ts)

**Propósito**: Switch que enruta al método de pago correcto

```typescript
export function CheckPaymentGateway(
  title: string,
  amount: number,
  typeOfPayment: string,
  setAlertMessage: (message: string) => void,
  currency: string,
  email: string,
  userCode: string,
  eventCode: string,
  paymentMethod: string,
  companyName: string,
  ruc: string
) {
  switch (paymentMethod) {
    case 'NIUBIZ':
      setAlertMessage('Por el momento no implementamos esta forma de pago')
      break
    case 'CULQI':
      getCulqiCheckout(title, amount, currency, email, userCode, eventCode, typeOfPayment, paymentMethod, companyName, ruc)
      break
    case 'PagoEfectivo':
      setAlertMessage('Por el momento no implementamos esta forma de pago')
      break
    case 'Paypal':
      setAlertMessage('Por el momento no implementamos esta forma de pago')
      break
    default:
      setAlertMessage('Seleccione un tipo de pago')
  }
}
```

---

### 4. Culqi Configuration
**Archivo**: [`ConfigCulqi.ts`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/components/components-home/components-buys/components-confirm/confirm-payment/ConfigCulqi.ts)

#### 4.1 Configuración de Culqi Checkout

```typescript
export function getConfig(amount: number, currency: string, title?: string) {
  return {
    settings: {
      title: title || 'LAVC 2025',
      currency: currency,        // "PEN" o "USD"
      amount: amount * 100       // Culqi requiere centavos
    },
    appearance: {
      theme: 'default',
      buttonCardPayText: 'Pagar'
    }
  }
}
```

#### 4.2 Inicialización de Culqi Checkout

```typescript
export async function getCulqiCheckout(
  title: string,
  amount: number,
  currency: string,
  email: string,
  userCode: string,
  eventCode: string,
  typeOfPayment: string,
  paymentMethod: string,
  companyName: string,
  ruc: string
) {
  // 1. Crear instancia de Culqi Checkout
  const _culqi = new (window as any).CulqiCheckout(
    process.env.NEXT_PUBLIC_CULQI_PUBLICKEY,
    getConfig(amount, currency, title)
  )

  // 2. Validar que Culqi se inicializó correctamente
  if (!_culqi) {
    Swal.fire({
      title: '¡ERROR!',
      text: 'Error en el proveedor Culqi',
      icon: 'error',
      confirmButtonText: 'Cerrar'
    })
    return
  }

  // 3. Abrir modal de Culqi
  _culqi.open()

  // 4. Configurar callback para cuando se genera el token
  _culqi.culqi = async () => {
    if (_culqi.token) {
      const token = _culqi.token.id
      _culqi.close()
      console.log('Se ha creado un Token:', token)

      // 5. Enviar token al backend para procesar el pago
      await sendPayment(
        token,
        amount,
        currency,
        email,
        userCode,
        eventCode,
        typeOfPayment,
        paymentMethod,
        companyName,
        ruc
      )
    } else {
      console.error('Error en el pago:', _culqi.error)
      Swal.fire({
        title: '¡ERROR!',
        text: _culqi.error || 'No se pudo procesar el pago.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      })
    }
  }
}
```

#### 4.3 Envío del Pago al Backend

```typescript
async function sendPayment(
  token: string,
  amount: number,
  currency: string,
  email: string,
  userCode: string,
  eventCode: string,
  typeOfPayment: string,
  paymentMethod: string,
  companyName: string,
  ruc: string
) {
  try {
    // Preparar payload
    const payload = {
      token,
      amount,
      currency,
      email,
      userCode,
      eventCode,
      typeOfPayment,
      paymentMethod,
      companyName,
      ruc
    }

    // Llamada al endpoint del backend
    const response = await Api.post(`/culqi/charge/`, payload)
    const result = response.data

    console.log("data:", response)

    // Manejo de respuesta exitosa
    if (response.status === 201) {
      Swal.fire({
        title: '¡ÉXITO!',
        text: 'El pago se realizó correctamente.',
        icon: 'success',
        confirmButtonText: 'Cerrar'
      })
    } else {
      Swal.fire({
        title: '¡ERROR!',
        text: result.message || 'Hubo un problema con el pago.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      })
    }
  } catch (error: any) {
    console.error('Error al procesar el pago:', error)
    Swal.fire({
      title: '¡ERROR!',
      text: error?.response?.data?.user_message || 'No se pudo procesar el pago',
      icon: 'error',
      confirmButtonText: 'Cerrar'
    })
  }
}
```

---

## 🔐 Integración Backend

### Endpoint de Pago

**URL**: `POST /culqi/charge/`

**Payload**:
```typescript
{
  token: string            // Token generado por Culqi
  amount: number           // Monto en unidades (no centavos)
  currency: string         // "PEN" o "USD"
  email: string            // Email del usuario
  userCode: string         // Código del usuario
  eventCode: string        // Código del evento
  typeOfPayment: string    // "Boleta" o "Factura"
  paymentMethod: string    // "CULQI"
  companyName: string      // Razón social (si es factura)
  ruc: string              // RUC (si es factura)
}
```

**Respuestas esperadas**:

**✅ Éxito** (201 Created):
```json
{
  "status": "success",
  "message": "Pago procesado correctamente"
  // ... otros datos del backend
}
```

**❌ Error** (4xx/5xx):
```json
{
  "status": "error",
  "message": "Mensaje de error",
  "user_message": "Mensaje amigable para el usuario"
}
```

### Configuración de Axios

**Archivo**: [`api.ts`](file:///c:/Users/Roy%20cari%20sarmiento/Desktop/LAVC/LAVC%202026%20-%20NUEVA%20WEB/lavc2025/src/api/api.ts)

```typescript
import axios from "axios"

const Api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_URL_BACKEND}`,
})

export default Api
```

> ⚠️ **Importante**: No hay interceptores configurados para agregar tokens de autenticación

---

## 🔒 Análisis de Seguridad

### ✅ Aspectos Positivos

1. **Tokens de un solo uso**: Culqi genera tokens que solo pueden usarse una vez
2. **PCI DSS Compliance**: Los datos de tarjeta nunca pasan por tu servidor
3. **HTTPS**: Culqi maneja la comunicación de forma segura
4. **Validación de sesión**: Se verifica que el usuario esté autenticado antes de pagar

### ⚠️ Vulnerabilidades Identificadas

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| **Datos sensibles en localStorage** | 🔴 Alta | Datos de pago (RUC, companyName, etc.) se guardan en localStorage sin cifrado |
| **Sin autenticación en API** | 🔴 Alta | No se envía token de autenticación en las peticiones al backend |
| **Validación solo en frontend** | 🟡 Media | Las validaciones de factura solo están en el cliente |
| **Logs en producción** | 🟡 Media | `console.log()` expone información sensible en consola |
| **Manejo de errores genérico** | 🟡 Media | No se registran errores para debugging |
| **Sin rate limiting** | 🟡 Media | No hay protección contra múltiples intentos de pago |

---

## 🐛 Problemas Identificados

### 1. **Gestión de Estado Pobre**

**Problema**: Se usa `localStorage` como única fuente de verdad

**Código actual**:
```typescript
// En cada página:
useEffect(() => {
  const storedEvent = localStorage.getItem('eventData')
  if (storedEvent) {
    setEventData(JSON.parse(storedEvent))
  }
}, [])
```

**Problemas**:
- Datos pueden estar desincronizados entre pestañas
- No hay validación de integridad
- Datos persisten después de completar la compra
- No hay tipado fuerte
- Difícil de testear

---

### 2. **Sin Autenticación en Peticiones Backend**

**Problema**: Las peticiones a `/culqi/charge/` no incluyen token de autenticación

**Código actual**:
```typescript
const response = await Api.post(`/culqi/charge/`, payload)
```

**Debería ser**:
```typescript
const response = await Api.post(`/culqi/charge/`, payload, {
  headers: {
    Authorization: `Bearer ${session?.accessToken}`
  }
})
```

---

### 3. **Navegación Sin Protección**

**Problema**: Un usuario puede acceder directamente a `/compra/confirmar` sin pasar por los pasos previos

**Solución recomendada**: Middleware de Next.js o validación en cada página

---

### 4. **Manejo de Errores Inconsistente**

**Problema**: Algunos errores usan `setAlertMessage`, otros usan `SweetAlert2`

**Ejemplos**:
```typescript
// En PaymentGateway.ts
setAlertMessage('Por el momento no implementamos esta forma de pago')

// En ConfigCulqi.ts
Swal.fire({
  title: '¡ERROR!',
  text: 'Error en el proveedor Culqi',
  icon: 'error'
})
```

---

### 5. **Datos del Usuario Hardcodeados**

**Problema**: Se accede a datos de sesión de forma poco segura

```typescript
email={(session as any)?.user?.user?.userName}
userCode={(session as any)?.user?.user?.userCode}
```

**Mejor enfoque**:
```typescript
interface SessionUser {
  user: {
    userName: string
    userCode: string
    personaNombre: string
  }
}

const session = useSession() as { data: SessionUser | null }
const email = session.data?.user?.userName ?? ''
```

---

### 6. **Sin Confirmación Post-Pago**

**Problema**: Después de un pago exitoso, solo se muestra un `SweetAlert`. No hay:
- Redirección a página de confirmación
- Generación de ticket/comprobante
- Email de confirmación
- Limpieza de `localStorage`

---

### 7. **Culqi Script Cargado en Cliente**

**Problema**: El script de Culqi se carga en el componente

```typescript
<Script src='https://js.culqi.com/checkout-js' />
```

**Riesgo**: 
- Puede no estar disponible cuando se necesita
- No hay manejo de error de carga
- Bloqueo de carga de la página

---

## 💡 Recomendaciones de Mejora

### 🎯 Prioridad Alta

#### 1. Implementar Gestión de Estado Global

**Usar Zustand** (más ligero que Redux para este caso):

```typescript
// stores/checkoutStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CheckoutState {
  // Datos del evento
  eventData: EventData | null
  
  // Datos de pago
  paymentMethod: string | null
  typeOfPayment: 'Boleta' | 'Factura'
  invoiceData: {
    ruc: string
    companyName: string
  }
  
  // Estado del proceso
  currentStep: 'ticket' | 'adicionales' | 'pago' | 'confirmar'
  termsAccepted: boolean
  
  // Actions
  setEventData: (data: EventData) => void
  setPaymentMethod: (method: string) => void
  setTypeOfPayment: (type: 'Boleta' | 'Factura') => void
  setInvoiceData: (data: { ruc: string; companyName: string }) => void
  setCurrentStep: (step: CheckoutState['currentStep']) => void
  setTermsAccepted: (accepted: boolean) => void
  resetCheckout: () => void
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      eventData: null,
      paymentMethod: null,
      typeOfPayment: 'Boleta',
      invoiceData: { ruc: '', companyName: '' },
      currentStep: 'ticket',
      termsAccepted: false,
      
      setEventData: (data) => set({ eventData: data }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setTypeOfPayment: (type) => set({ typeOfPayment: type }),
      setInvoiceData: (data) => set({ invoiceData: data }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),
      resetCheckout: () => set({
        eventData: null,
        paymentMethod: null,
        typeOfPayment: 'Boleta',
        invoiceData: { ruc: '', companyName: '' },
        currentStep: 'ticket',
        termsAccepted: false
      })
    }),
    {
      name: 'checkout-storage',
      partialize: (state) => ({
        // Solo persistir datos no sensibles
        eventData: state.eventData,
        currentStep: state.currentStep
      })
    }
  )
)
```

**Uso en componentes**:
```typescript
// En /compra/confirmar/page.tsx
import { useCheckoutStore } from '@/stores/checkoutStore'

const Confirm = () => {
  const { eventData, paymentMethod, typeOfPayment, invoiceData, termsAccepted, setTermsAccepted } = useCheckoutStore()
  
  // ...resto del componente
}
```

---

#### 2. Agregar Interceptor de Axios para Autenticación

```typescript
// api/api.ts
import axios from "axios"
import { getSession } from "next-auth/react"

const Api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_URL_BACKEND}`,
})

// Interceptor para agregar token
Api.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejo de errores global
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logear errores
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    })
    
    // Manejo específico de errores 401
    if (error.response?.status === 401) {
      // Redirigir a login o refrescar token
      window.location.href = '/auth/signin'
    }
    
    return Promise.reject(error)
  }
)

export default Api
```

---

#### 3. Crear Hook Personalizado para Pago con Culqi

```typescript
// hooks/useCulqiPayment.ts
import { useState, useCallback } from 'react'
import Swal from 'sweetalert2'
import Api from '@/api/api'

interface CulqiPaymentParams {
  title: string
  amount: number
  currency: string
  email: string
  userCode: string
  eventCode: string
  typeOfPayment: string
  paymentMethod: string
  companyName: string
  ruc: string
}

export const useCulqiPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiateCulqiCheckout = useCallback(async (params: CulqiPaymentParams) => {
    try {
      setIsProcessing(true)
      setError(null)

      // Validar que Culqi esté disponible
      if (typeof window === 'undefined' || !window.CulqiCheckout) {
        throw new Error('Culqi no está disponible')
      }

      const config = {
        settings: {
          title: params.title || 'LAVC 2025',
          currency: params.currency,
          amount: params.amount * 100
        },
        appearance: {
          theme: 'default',
          buttonCardPayText: 'Pagar'
        }
      }

      const culqi = new window.CulqiCheckout(
        process.env.NEXT_PUBLIC_CULQI_PUBLICKEY,
        config
      )

      culqi.open()

      culqi.culqi = async () => {
        if (culqi.token) {
          const token = culqi.token.id
          culqi.close()

          // Enviar al backend
          const payload = {
            token,
            amount: params.amount,
            currency: params.currency,
            email: params.email,
            userCode: params.userCode,
            eventCode: params.eventCode,
            typeOfPayment: params.typeOfPayment,
            paymentMethod: params.paymentMethod,
            companyName: params.companyName,
            ruc: params.ruc
          }

          const response = await Api.post('/culqi/charge/', payload)

          if (response.status === 201) {
            await Swal.fire({
              title: '¡ÉXITO!',
              text: 'El pago se realizó correctamente.',
              icon: 'success',
              confirmButtonText: 'Ver mi ticket'
            })
            
            // Redirigir a página de confirmación
            window.location.href = '/compra/confirmacion'
          } else {
            throw new Error(response.data?.message || 'Error al procesar el pago')
          }
        } else {
          throw new Error(culqi.error || 'Error en la generación del token')
        }
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.user_message || err.message || 'Error desconocido'
      setError(errorMessage)
      
      await Swal.fire({
        title: '¡ERROR!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    initiateCulqiCheckout,
    isProcessing,
    error
  }
}

// Uso en componentes:
const { initiateCulqiCheckout, isProcessing } = useCulqiPayment()

const handlePay = () => {
  initiateCulqiCheckout({
    title: eventName,
    amount: parseFloat(price),
    currency: currency,
    // ...otros parámetros
  })
}
```

---

#### 4. Middleware de Protección de Rutas

```typescript
// middleware.ts (en la raíz del proyecto)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas de compra que requieren autenticación
  const protectedPurchaseRoutes = [
    '/compra/pago',
    '/compra/confirmar'
  ]

  if (protectedPurchaseRoutes.some(route => pathname.includes(route))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
      // Redirigir a login con callback
      const url = new URL('/auth/signin', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Validar que existan datos de compra en proceso
    // (esto requeriría una implementación más compleja con cookies o sesión)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/compra/:path*']
}
```

---

#### 5. Validación de Datos con Zod

```typescript
// schemas/checkoutSchemas.ts
import { z } from 'zod'

export const InvoiceDataSchema = z.object({
  ruc: z.string()
    .min(11, 'RUC debe tener 11 dígitos')
    .max(11, 'RUC debe tener 11 dígitos')
    .regex(/^[0-9]+$/, 'RUC solo debe contener números'),
  companyName: z.string()
    .min(3, 'Razón social debe tener al menos 3 caracteres')
    .max(100, 'Razón social es muy larga')
})

export const PaymentDataSchema = z.object({
  paymentMethod: z.enum(['CULQI', 'Paypal', 'NIUBIZ', 'PagoEfectivo']),
  typeOfPayment: z.enum(['Boleta', 'Factura']),
  invoiceData: InvoiceDataSchema.optional()
}).refine(
  (data) => {
    // Si es factura, invoiceData es requerido
    if (data.typeOfPayment === 'Factura') {
      return data.invoiceData !== undefined
    }
    return true
  },
  {
    message: 'Datos de factura son requeridos',
    path: ['invoiceData']
  }
)

// Uso:
const result = PaymentDataSchema.safeParse({
  paymentMethod: 'CULQI',
  typeOfPayment: 'Factura',
  invoiceData: { ruc: '12345678901', companyName: 'Mi Empresa SAC' }
})

if (!result.success) {
  console.error(result.error.flatten())
}
```

---

#### 6. Componente de Loading Durante el Pago

```typescript
// components/PaymentProcessing.tsx
import { Box, CircularProgress, Typography } from '@mui/material'

interface PaymentProcessingProps {
  isProcessing: boolean
}

export const PaymentProcessing = ({ isProcessing }: PaymentProcessingProps) => {
  if (!isProcessing) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <CircularProgress size={60} sx={{ color: 'var(--primary-color-purple)' }} />
      <Typography variant="h6" sx={{ color: 'white', mt: 3 }}>
        Procesando pago...
      </Typography>
      <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
        Por favor, no cierres esta ventana
      </Typography>
    </Box>
  )
}
```

---

### 🎯 Prioridad Media

#### 7. Logger Centralizado

```typescript
// utils/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
  level: LogLevel
  message: string
  context?: string
  data?: any
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: string, data?: any) {
    const logData: LogData = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    }

    // En desarrollo, usar console
    if (this.isDevelopment) {
      const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[method](`[${level.toUpperCase()}] ${context ? `[${context}]` : ''} ${message}`, data || '')
    }

    // En producción, enviar a servicio de logging (ej: Sentry, LogRocket)
    if (!this.isDevelopment && level === 'error') {
      // Sentry.captureException(new Error(message), { extra: { context, data } })
    }
  }

  info(message: string, context?: string, data?: any) {
    this.log('info', message, context, data)
  }

  warn(message: string, context?: string, data?: any) {
    this.log('warn', message, context, data)
  }

  error(message: string, context?: string, data?: any) {
    this.log('error', message, context, data)
  }

  debug(message: string, context?: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, context, data)
    }
  }
}

export const logger = new Logger()

// Uso:
logger.info('Pago iniciado', 'CulqiCheckout', { amount, currency })
logger.error('Error al procesar pago', 'CulqiCheckout', error)
```

---

#### 8. Retry Logic para Peticiones Fallidas

```typescript
// utils/retry.ts
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError
}

// Uso:
const response = await retryAsync(
  () => Api.post('/culqi/charge/', payload),
  3,
  1000
)
```

---

#### 9. Toast Notifications en lugar de SweetAlert

```typescript
// Usar react-hot-toast o sonner para notificaciones menos intrusivas

import toast from 'react-hot-toast'

// En lugar de:
Swal.fire({
  title: '¡ÉXITO!',
  text: 'El pago se realizó correctamente.',
  icon: 'success'
})

// Usar:
toast.success('El pago se realizó correctamente.', {
  duration: 4000,
  position: 'top-right'
})

// Para errores:
toast.error('No se pudo procesar el pago', {
  duration: 6000,
  position: 'top-right'
})

// Loading toast durante el proceso:
const toastId = toast.loading('Procesando pago...')

// Luego actualizar:
toast.success('Pago exitoso!', { id: toastId })
// o
toast.error('Error en el pago', { id: toastId })
```

---

## 🏆 Mejores Prácticas

### 1. Separación de Concerns

**Crear estructura modular**:

```
src/
├── features/
│   └── checkout/
│       ├── components/
│       │   ├── PaymentMethodSelector.tsx
│       │   ├── InvoiceForm.tsx
│       │   └── CheckoutSummary.tsx
│       ├── hooks/
│       │   ├── useCulqiPayment.ts
│       │   ├── useCheckoutValidation.ts
│       │   └── useCheckoutNavigation.ts
│       ├── services/
│       │   ├── culqiService.ts
│       │   └── checkoutApi.ts
│       ├── stores/
│       │   └── checkoutStore.ts
│       ├── schemas/
│       │   └── checkoutSchemas.ts
│       └── types/
│           └── checkout.types.ts
```

---

### 2. Tipado Fuerte con TypeScript

```typescript
// types/checkout.types.ts
export enum PaymentMethod {
  CULQI = 'CULQI',
  PAYPAL = 'Paypal',
  NIUBIZ = 'NIUBIZ',
  PAGO_EFECTIVO = 'PagoEfectivo'
}

export enum PaymentType {
  BOLETA = 'Boleta',
  FACTURA = 'Factura'
}

export enum Currency {
  PEN = 'PEN',
  USD = 'USD'
}

export interface EventData {
  name: string
  image: string
  place: string
  date: string
  ticket: string
  price: number  // number en lugar de string
  currency: Currency
  eventCode: string
  eventType: string
}

export interface InvoiceData {
  ruc: string
  companyName: string
}

export interface CheckoutData {
  eventData: EventData
  paymentMethod: PaymentMethod
  typeOfPayment: PaymentType
  invoiceData?: InvoiceData
}

export interface CulqiChargeRequest {
  token: string
  amount: number
  currency: Currency
  email: string
  userCode: string
  eventCode: string
  typeOfPayment: PaymentType
  paymentMethod: PaymentMethod
  companyName?: string
  ruc?: string
}

export interface CulqiChargeResponse {
  status: 'success' | 'error'
  message: string
  transactionId?: string
  ticketId?: string
}
```

---

### 3. Testing

```typescript
// __tests__/hooks/useCulqiPayment.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCulqiPayment } from '@/hooks/useCulqiPayment'

describe('useCulqiPayment', () => {
  it('debe procesar un pago exitoso', async () => {
    const { result } = renderHook(() => useCulqiPayment())
    
    await act(async () => {
      await result.current.initiateCulqiCheckout({
        title: 'Test Event',
        amount: 100,
        currency: 'PEN',
        // ...otros parámetros
      })
    })
    
    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})
```

---

### 4. Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_CULQI_PUBLICKEY=pk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_URL_BACKEND=https://api.lavc.com

# .env.production
NEXT_PUBLIC_CULQI_PUBLICKEY=pk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_URL_BACKEND=https://api.lavc.com
```

**Validar variables de entorno**:

```typescript
// config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_CULQI_PUBLICKEY: z.string().min(1),
  NEXT_PUBLIC_URL_BACKEND: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
})

const env = envSchema.parse({
  NEXT_PUBLIC_CULQI_PUBLICKEY: process.env.NEXT_PUBLIC_CULQI_PUBLICKEY,
  NEXT_PUBLIC_URL_BACKEND: process.env.NEXT_PUBLIC_URL_BACKEND,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
})

export default env
```

---

## 📋 Plan de Implementación

### Fase 1: Fundamentos (Semana 1-2)

- [ ] Implementar Zustand store
- [ ] Agregar interceptores de Axios
- [ ] Crear tipos TypeScript completos
- [ ] Agregar validación con Zod
- [ ] Configurar logger

### Fase 2: Mejoras de UX/UI (Semana 3)

- [ ] Crear hook `useCulqiPayment`
- [ ] Implementar componente de loading
- [ ] Migrar a toast notifications
- [ ] Agregar página de confirmación post-pago

### Fase 3: Seguridad (Semana 4)

- [ ] Implementar middleware de autenticación
- [ ] Agregar validación backend de datos
- [ ] Implementar rate limiting
- [ ] Auditoría de seguridad

### Fase 4: Testing y Monitoreo (Semana 5)

- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración
- [ ] Configurar error tracking (Sentry)
- [ ] Implementar analytics

### Fase 5: Optimización (Semana 6)

- [ ] Implementar retry logic
- [ ] Optimizar carga de scripts
- [ ] Code splitting
- [ ] Performance audit

---

## 🎓 Conclusión

El flujo actual de Culqi **funciona**, pero tiene **espacio significativo para mejora** en términos de:

1. ✅ **Seguridad**: Implementar autenticación, cifrado de datos sensibles
2. ✅ **Arquitectura**: Separación de concerns, gestión de estado global
3. ✅ **UX**: Mejor feedback al usuario, manejo de errores
4. ✅ **Mantenibilidad**: Tipado fuerte, testing, logging
5. ✅ **Escalabilidad**: Preparar para múltiples métodos de pago

**Prioridades inmediatas**:
1. 🔴 Implementar autenticación en peticiones backend
2. 🔴 Migrar de localStorage a Zustand
3. 🟡 Crear página de confirmación post-pago
4. 🟡 Agregar validación con Zod
5. 🟢 Implementar logger y error tracking

---

## 📚 Referencias

- [Documentación Culqi](https://docs.culqi.com/)
- [Culqi Checkout JS](https://docs.culqi.com/es/documentacion/checkout/v4/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

---

**Fecha de creación**: 2026-01-09  
**Última actualización**: 2026-01-09  
**Versión**: 1.0.0  
**Autor**: Análisis técnico para LAVC 2025
