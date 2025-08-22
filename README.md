# lavc-back

Backend del **LAVC (Latin American Veterinary Conference)** desarrollado con **NestJS** y **TypeScript**. Provee APIs para gestión de eventos, tickets y módulos relacionados.

> **Stack**: NestJS · Node.js · TypeScript · (MongoDB vía Docker) · Docker Compose

---

## 📦 Requisitos

- **Docker** y **Docker Compose v2**
  - Verifica: `docker --version` y `docker compose version`
- **Node.js 18+** (solo si vas a correr en modo local sin Docker)
- **Git**

> En Windows se recomienda **WSL2** para mejor desempeño con Docker.

---

## 🔧 Configuración rápida

1. **Clona el repo**

   ```bash
   git clone git@github.com:Roycs1998/new-back-lavc.git
   cd new-back-lavc
   ```

2. **Variables de entorno**
   - Copia el ejemplo y edítalo:
     ```bash
     # Linux/Mac
     cp .env.example .env
     # Windows PowerShell
     copy .env.example .env
     ```
   - Valores sugeridos (ajústalos a tu necesidad):

     ```dotenv
     # App
     NODE_ENV=development
     PORT=3000
     CORS_ORIGIN=*

     # Mongo
     MONGODB_URI=mongodb://mongo:27017/lavc
     MONGODB_DB=lavc

     # Auth
     JWT_SECRET=change-me-super-secret

     # Swagger (si usas @nestjs/swagger)
     SWAGGER_ENABLED=true
     SWAGGER_PATH=/docs
     ```

---

## ▶️ Ejecutar con Docker (recomendado)

Este proyecto incluye **docker-compose** con al menos dos servicios:

- `api`: la app NestJS
- `mongo`: base de datos MongoDB (persistencia en volumen)

> Si tus nombres difieren, actualiza los comandos y ejemplos.

### 1) Levantar todo

```bash
docker compose up -d --build
```

- **Primera vez**: construye imágenes y crea contenedores/volúmenes.
- **Logs en vivo**:
  ```bash
  docker compose logs -f api
  ```
- **Ver estado**:
  ```bash
  docker compose ps
  ```

### 2) Probar que responde

- API: `http://localhost:3000/` (o el `PORT` que definas)
- Swagger (si está habilitado): `http://localhost:3000/docs`

### 3) Apagar y limpiar

```bash
# Apagar contenedores (mantiene datos)
docker compose down

# Apagar y borrar datos (⚠️ elimina el volumen de Mongo)
docker compose down -v
```

---

## 🧪 Desarrollo sin Docker (opcional)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Asegúrate de tener **MongoDB** corriendo localmente o ajusta `MONGODB_URI` para usar un cluster remoto.
3. Ejecuta:

   ```bash
   # desarrollo
   npm run start:dev

   # producción
   npm run start:prod
   ```

---

## 📜 Scripts útiles

```bash
# desarrollo (watch)
npm run start:dev

# producción (build + start)
npm run build && npm run start:prod

# tests
npm run test          # unit
npm run test:e2e      # e2e
npm run test:cov      # cobertura

# lint
npm run lint
```

---

## 🗂️ Estructura del proyecto (resumen)

```
src/
  main.ts
  app.module.ts
  common/        # filtros, pipes, guards, interceptors
  config/        # cargado de .env, schemas de configuración
  modules/       # módulos de dominio (events, tickets, users, etc.)
  infra/         # adaptadores (db/mongoose, mail, cache, etc.)
test/
docker/
  mongo/         # init scripts, seeds opcionales
```

> Ajusta los nombres de carpetas a tu organización real.

---

## 🧩 Docker Compose explicado

Un `docker-compose.yml` típico para este proyecto luce así (ejemplo orientativo):

```yaml
services:
  mongo:
    image: mongo:7
    container_name: lavc_mongo
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: lavc_api
    env_file: .env
    ports:
      - '${PORT:-3000}:3000'
    depends_on:
      - mongo
    # Si usas hot-reload en docker:
    # volumes:
    #   - ./:/usr/src/app
    #   - /usr/src/app/node_modules

volumes:
  mongo_data:
```

- **mongo**: expone `27017` y guarda datos en `mongo_data`.
- **api**: expone `3000` (mapeado a tu `PORT`), lee variables desde `.env` y depende de `mongo`.
- La app se conecta usando `MONGODB_URI=mongodb://mongo:27017/lavc` porque dentro de la red de Docker el host es el **nombre del servicio** (`mongo`).

---

## 🧭 Endpoints y documentación

- **Swagger** (si `SWAGGER_ENABLED=true`): visita `http://localhost:3000/docs`
- Autogenera contratos y pruébalos allí.

---

## 🚀 Despliegue

- **Imagen de producción**:
  ```bash
  docker build -t lavc-back:prod --target production .
  ```
- **Correr en prod** (ejemplo simple):
  ```bash
  docker run -d --name lavc_api     --env-file .env     -p 3000:3000 lavc-back:prod
  ```

Para entornos cloud, usa variables seguras (no subas `.env` al repo) y un servicio gestionado de Mongo si lo prefieres.

---

## 🆘 Troubleshooting

- **Puerto ocupado (EADDRINUSE)**: cambia `PORT` en `.env` o libera el puerto:

  ```bash
  # Linux/Mac
  lsof -i :3000
  kill -9 <PID>

  # Windows PowerShell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

- **No conecta a Mongo (ECONNREFUSED)**:
  - Verifica logs: `docker compose logs -f mongo`
  - Asegura que `MONGODB_URI` apunta a `mongo` (no a `localhost`) cuando corres en Docker.

- **Apple Silicon (M1/M2) e imágenes x86**:

  ```bash
  export DOCKER_DEFAULT_PLATFORM=linux/amd64
  docker compose build --no-cache
  ```

- **Windows + Docker Desktop**: habilita WSL2 en Docker Desktop → Settings → General → “Use the WSL 2 based engine”.

---

## 🛡️ Buenas prácticas (sugerencias)

- No subas `.env` al repo. Mantén un `.env.example`.
- Usa `--force-with-lease` si necesitas sobrescribir en remoto con seguridad.
- Añade **husky + lint-staged** para validar commits.
- Considera **rate limiting**, **helmet** y **CORS** configurados en `main.ts`.

---

## 📄 Licencia

MIT — ver `LICENSE`.
