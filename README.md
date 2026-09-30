@'
# Sistema de Gestión y Reporte de Baches

Aplicación web desarrollada para registrar, consultar, administrar y dar seguimiento a reportes ciudadanos relacionados con baches y afectaciones en la infraestructura vial.

El sistema cuenta con un portal ciudadano y módulos internos para Administrador, Revisor y Cuadrillas de reparación.

---

## Descripción

El Sistema de Gestión y Reporte de Baches permite que cualquier ciudadano registre un reporte sin necesidad de crear una cuenta.

Cada reporte genera un folio que permite consultar posteriormente el estado de atención.

El personal autorizado puede revisar los reportes, asignar cuadrillas, consultar la ubicación del incidente, registrar evidencias fotográficas y dar seguimiento al proceso de reparación.

---

## Funciones principales

### Portal ciudadano

- Registro de reportes sin iniciar sesión.
- Captura de ubicación mediante GPS o dirección manual.
- Registro de calle, colonia y entre calles.
- Descripción del problema.
- Clasificación de severidad:
  - Alta
  - Media
  - Baja
- Carga de evidencia fotográfica.
- Generación de folio.
- Consulta del estado del reporte mediante folio.
- Visualización del avance del reporte.

### Administrador

- Inicio de sesión.
- Consulta general de reportes.
- Estadísticas de reportes.
- Seguimiento por estado.
- Visualización geográfica de reportes.
- Registro de cuadrillas.
- Registro del responsable de cada cuadrilla.
- Asignación de cuadrillas a los reportes.
- Consulta del responsable que realizará la reparación.

### Revisor

- Inicio de sesión.
- Consulta de reportes nuevos.
- Revisión de información del ciudadano.
- Consulta de ubicación y mapa.
- Consulta de evidencia fotográfica.
- Seguimiento de reportes en reparación.
- Consulta de la cuadrilla asignada.
- Consulta de evidencias de reparación.
- Validación del trabajo realizado.
- Cierre del reporte como Atendido.

### Cuadrilla

- Inicio de sesión.
- Consulta únicamente de trabajos asignados a su cuadrilla.
- Visualización de folio, ubicación y severidad.
- Consulta del mapa.
- Consulta de evidencias del daño.
- Registro de fotografías de la reparación.
- Seguimiento del trabajo asignado.

---

## Estados de un reporte

El sistema utiliza el siguiente flujo:

Reportado → En Proceso → Atendido

### Reportado

El reporte fue registrado por un ciudadano y está pendiente de revisión.

### En Proceso

El reporte fue aceptado y puede contar con una cuadrilla asignada para realizar la reparación.

### Atendido

La reparación fue validada y el reporte fue finalizado.

Para finalizar un reporte se requiere una cuadrilla asignada y evidencia fotográfica de la reparación.

---

## Arquitectura

El proyecto utiliza una arquitectura cliente-servidor:

Frontend → Backend → Base de datos

### Frontend

- React
- TypeScript
- Vite
- CSS
- OpenStreetMap

### Backend

- NestJS
- TypeScript
- TypeORM
- JWT
- bcrypt
- Multer

### Base de datos

- MySQL 8

### Contenedores

- Docker
- Docker Compose

---

## Estructura del proyecto

```text
sistema_gestion_baches/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── cuadrillas/
│   │   ├── reportes/
│   │   └── usuarios/
│   ├── uploads/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── assets/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md