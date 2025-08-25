export const swaggerConfig = {
  title: 'LAVC - Plataforma de Eventos API',
  description: `
    API REST para la plataforma de gestión de eventos del Latin American Veterinary Conference.
    
    ## Funcionalidades
    - 🎫 Gestión de eventos y tickets
    - 👥 Gestión de usuarios y permisos multi-tenant
    - 💳 Procesamiento de pagos
    - 📱 Generación y validación de códigos QR
    - 📊 Analíticas y reportes
    
    ## Autenticación
    Utiliza Bearer Token JWT. Obtén tu token en el endpoint de login.
    
    ## Paginación
    Los endpoints que retornan listas soportan paginación con \`page\` y \`limit\`.
  `,
  version: '1.0.0',
  contact: {
    name: 'LAVC Development Team',
    email: 'dev@lavc.com',
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Desarrollo Local',
    },
    {
      url: 'https://api-staging.lavc.com/api/v1',
      description: 'Staging',
    },
    {
      url: 'https://api.lavc.com/api/v1',
      description: 'Producción',
    },
  ],
};
