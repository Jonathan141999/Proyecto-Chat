# Diagnóstico Automatizado de Trámites Municipales

Un chatbot inteligente que guía a los ciudadanos a través de trámites municipales comunes, proporcionando información personalizada y pasos específicos según sus necesidades.

## 🎯 Características

- **5 Trámites Modelados**: Licencia Comercial, Permiso de Construcción, Certificado de Habitabilidad, Licencia de Funcionamiento, y Permiso para Eventos
- **Árbol de Decisiones Inteligente**: Sistema de preguntas guiadas que adapta las respuestas según las necesidades del usuario
- **Interfaz Moderna**: Diseño responsive con Bootstrap y CSS personalizado
- **Base de Datos Firebase**: Almacenamiento de conversaciones para análisis y mejora continua
- **Experiencia de Usuario Optimizada**: Chat intuitivo con animaciones y feedback visual

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React.js, Bootstrap 5, CSS3
- **Backend**: Firebase Firestore
- **Herramientas**: Node.js, npm
- **Iconos**: Font Awesome

## 📋 Trámites Incluidos

### 1. Licencia Comercial
- Guía para abrir negocios comerciales
- Verificación de requisitos de local y seguridad
- Documentación necesaria

### 2. Permiso de Construcción
- Autorización para construir o remodelar
- Verificación de planos y zonificación
- Requisitos de presupuesto

### 3. Certificado de Habitabilidad
- Certificación de viviendas habitables
- Verificación de servicios básicos
- Documentación de propiedad

### 4. Licencia de Funcionamiento
- Permisos para establecimientos
- Requisitos de área y seguridad
- Registro en SUNAT

### 5. Permiso para Eventos
- Autorización para eventos públicos
- Control de capacidad y horarios
- Permisos de espacio público

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Firebase

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd tramites-municipales-chatbot
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Firestore Database
   - Obtén las credenciales de configuración
   - Actualiza `src/firebase/config.js` con tus credenciales:

   ```javascript
   const firebaseConfig = {
     apiKey: "tu-api-key",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto-id",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "123456789",
     appId: "tu-app-id"
   };
   ```

4. **Ejecutar la aplicación**
   ```bash
   npm start
   ```

5. **Abrir en el navegador**
   - La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Chatbot.js          # Componente principal del chatbot
│   └── Chatbot.css         # Estilos del chatbot
├── data/
│   └── tramites.js         # Datos de trámites y árbol de decisiones
├── services/
│   └── firebaseService.js  # Servicios de Firebase
├── firebase/
│   └── config.js           # Configuración de Firebase
├── App.js                  # Componente principal
├── App.css                 # Estilos globales
├── index.js                # Punto de entrada
└── index.css               # Estilos base
```

## 🎮 Uso del Chatbot

1. **Selección de Trámite**: El usuario selecciona el trámite que desea realizar
2. **Preguntas Guiadas**: El sistema hace preguntas específicas para entender las necesidades
3. **Resultado Personalizado**: Se proporciona información específica y pasos a seguir
4. **Almacenamiento**: La conversación se guarda en Firebase para análisis

## 🔧 Personalización

### Agregar Nuevos Trámites

1. Edita `src/data/tramites.js`
2. Agrega el nuevo trámite siguiendo la estructura existente
3. Define las preguntas y opciones del árbol de decisiones
4. Agrega los resultados correspondientes

### Modificar Estilos

- Los estilos del chatbot están en `src/components/Chatbot.css`
- Los estilos globales están en `src/App.css`

## 📊 Base de Datos

### Estructura de Firestore

```javascript
conversations/
├── documentId/
│   ├── tramite: string
│   ├── conversationPath: array
│   ├── result: string
│   ├── timestamp: timestamp
│   └── createdAt: string
```

### Consultas Útiles

- **Conversaciones por trámite**: Para análisis de popularidad
- **Resultados más comunes**: Para identificar necesidades frecuentes
- **Patrones de conversación**: Para mejorar el árbol de decisiones

## 🧪 Pruebas

```bash
# Ejecutar pruebas
npm test

# Ejecutar pruebas con cobertura
npm test -- --coverage
```

## 📦 Despliegue

### Firebase Hosting

1. **Instalar Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Inicializar Firebase**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Construir y desplegar**
   ```bash
   npm run build
   firebase deploy
   ```

### Otros Servicios

- **Vercel**: Conecta tu repositorio de GitHub
- **Netlify**: Arrastra la carpeta `build` después de `npm run build`
- **Heroku**: Configura el buildpack de Node.js

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

## 🔮 Próximas Mejoras

- [ ] Integración con APIs municipales reales
- [ ] Sistema de notificaciones
- [ ] Panel de administración
- [ ] Análisis avanzado de datos
- [ ] Soporte multiidioma
- [ ] Integración con WhatsApp Business API

---

**Desarrollado con ❤️ para mejorar la experiencia de los ciudadanos con los trámites municipales** 