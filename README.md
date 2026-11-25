# FindAll Marketplace 2.0

## Descripción

FindAll Marketplace 2.0 es una aplicación móvil desarrollada con React Native y Expo que simula un marketplace. Permite a los usuarios explorar productos, gestionar un carrito de compras, comparar artículos, administrar favoritos y consultar sus pedidos.

El proyecto también incorpora funcionalidades para vendedores y un centro de ayuda para gestionar solicitudes relacionadas con las compras.

## Tecnologías utilizadas

- React Native
- Expo
- JavaScript
- AsyncStorage
- Expo Vector Icons
- Expo Linear Gradient

## Requisitos previos

Antes de ejecutar el proyecto, es necesario tener instalado:

- Node.js
- npm
- Expo Go en el dispositivo móvil (opcional, para probar la aplicación desde el celular).

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/ireguisara09/FindAll.git
```

### 2. Ingresar a la carpeta del proyecto

```bash
cd FindAll
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Iniciar el proyecto

```bash
npx expo start
```

### 5. Abrir la aplicación

Una vez iniciado Expo:

- Escanea el código QR con Expo Go desde tu dispositivo móvil.
- También puedes utilizar las opciones que muestra la terminal para ejecutar el proyecto en un emulador o navegador, según la configuración disponible.

## Estructura del proyecto

```text
FindAll/
│
├── assets/
│
├── src/
│   ├── components/
│   ├── context/
│   │   └── AppContext.js
│   ├── data/
│   ├── screens/
│   ├── utils/
│   └── theme.js
│
├── App.js
├── package.json
└── README.md
```

## Funcionalidades principales

- Catálogo de productos.
- Búsqueda y exploración de artículos.
- Carrito de compras.
- Comparación de productos.
- Gestión de productos favoritos.
- Historial y seguimiento de pedidos.
- Gestión de direcciones.
- Centro de notificaciones.
- Módulo de vendedor para administrar productos.
- Centro de ayuda y solicitudes de soporte.

## Almacenamiento de información

El proyecto utiliza almacenamiento local mediante AsyncStorage para conservar información de la aplicación en el dispositivo.

Las funcionalidades se desarrollan bajo un enfoque de simulación académica; no se requiere una conexión a una base de datos externa ni a servicios reales de pago.

## Autoría

Proyecto académico desarrollado como parte del proceso formativo.

**FindAll Marketplace 2.0**
