# Auralis - Backend

API de la clase en vivo. Los participantes identificados publican mensajes y el resto los recibe al instante, sin recargar la pantalla.

Repositorio: https://github.com/CarlosBustos97/auralis-backend

## Requisitos

- Node.js 18 o superior
- Docker, para MongoDB

## Instalación

1. Levantar la base de datos:

```bash
docker compose up -d
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo `.env` a partir de `.env-example`:

```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/auralis
JWT_SECRET=cambia_este_secreto
CLIENT_ORIGIN=http://localhost:3000
```

4. Iniciar la API:

```bash
npm start
```

La API queda en `http://localhost:5000`.

La primera vez se crean dos usuarios de demostración:

| Nombre | Usuario | Contraseña | Rol |
| --- | --- | --- | --- |
| Ana Ríos | ana.rios | aula123 | moderador |
| Leo Martínez | leo.martinez | aula123 | estudiante |

## Rutas

- `POST /api/auth/register` registra nombre, usuario único, contraseña y rol (`estudiante` o `moderador`)
- `POST /api/auth/login` devuelve el token de sesión
- `GET /api/auth/me` devuelve el participante autenticado
- `GET /api/message/getAll` lista el chat persistido
- `POST /api/message/store` guarda un mensaje del usuario autenticado y lo emite por Socket.IO

El historial y el envío exigen el header `Authorization: Bearer <token>`. El socket también exige ese token.

## Pruebas

Con MongoDB en marcha:

```bash
npm test
```
