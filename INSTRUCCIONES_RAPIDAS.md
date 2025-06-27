# 🚀 Instrucciones Rápidas - Chatbot de Trámites Municipales

## ✅ **CONFIGURACIÓN COMPLETADA**

Tu proyecto ya está configurado con Firebase:
- **Proyecto:** chat-58b26
- **Base de datos:** Firestore habilitado
- **Analytics:** Configurado y activo

## ⚡ Configuración Inmediata

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Verificar Firebase (Ya configurado)
✅ Las credenciales de Firebase ya están configuradas en `src/firebase/config.js`

**Para verificar que todo funciona:**
1. Ve a [Firebase Console - chat-58b26](https://console.firebase.google.com/project/chat-58b26)
2. Verifica que Firestore Database esté habilitado
3. Si no está habilitado, haz clic en "Crear base de datos" y selecciona "Modo de prueba"

### 3. Ejecutar la Aplicación
```bash
npm start
```

### 4. Abrir en el Navegador
- Ve a: `http://localhost:3000`

## 🎯 Funcionalidades Principales

### Trámites Disponibles:
1. **Licencia Comercial** - Para abrir negocios
2. **Permiso de Construcción** - Para construir/remodelar
3. **Certificado de Habitabilidad** - Para viviendas
4. **Licencia de Funcionamiento** - Para establecimientos
5. **Permiso para Eventos** - Para eventos públicos

### Características del Chatbot:
- ✅ Preguntas guiadas inteligentes
- ✅ Respuestas personalizadas
- ✅ Almacenamiento automático en Firebase
- ✅ Analytics en tiempo real
- ✅ Interfaz moderna y responsive
- ✅ 5 flujos de trámites completos

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm start          # Iniciar servidor de desarrollo
npm run dev        # Alias para desarrollo

# Construcción
npm run build      # Construir para producción

# Pruebas
npm test           # Ejecutar pruebas

# Despliegue en Firebase
npm run deploy     # Desplegar en Firebase Hosting
```

## 📱 Uso del Chatbot

1. **Selecciona un trámite** de la lista disponible
2. **Responde las preguntas** que te hace el chatbot
3. **Recibe información personalizada** y pasos específicos
4. **La conversación se guarda** automáticamente en Firebase
5. **Analytics registra** el comportamiento del usuario

## 📊 Monitoreo y Analytics

### Eventos que se registran automáticamente:
- `tramite_selected` - Cuando se selecciona un trámite
- `conversation_started` - Cuando inicia una conversación
- `conversation_saved` - Cuando se guarda una conversación
- `stats_viewed` - Cuando se ven las estadísticas
- `firebase_error` - Cuando ocurre un error

### Ver Analytics:
1. Ve a [Firebase Console](https://console.firebase.google.com/project/chat-58b26)
2. Navega a Analytics
3. Revisa los eventos en tiempo real

## 🚨 Solución de Problemas

### Error de Firebase:
- ✅ Las credenciales ya están configuradas
- Verifica que Firestore esté habilitado en la consola
- Asegúrate de que las reglas permitan lectura/escritura

### Error de Dependencias:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puerto Ocupado:
```bash
# Usar puerto diferente
PORT=3001 npm start
```

### Verificar Conexión:
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca mensajes de "Conversación guardada con ID:"

## 📁 Estructura de Datos en Firebase

### Colección: `conversations`
```javascript
{
  tramite: "licenciaComercial",
  conversationPath: [
    { tramite: "licenciaComercial", question: 1 },
    { answer: "Restaurante" },
    { question: 2 },
    { answer: "Sí, ya está alquilado" }
  ],
  result: "resultadoExitoso",
  timestamp: Timestamp,
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Seguridad

- Las reglas de Firestore están configuradas para desarrollo
- Para producción, actualiza `firestore.rules` con reglas más restrictivas
- Analytics está habilitado para monitoreo

## 📞 Soporte

- Revisa el `README.md` completo
- Verifica la configuración en `firebase.config.js`
- Consulta la consola de Firebase para logs y errores

## 🚀 Despliegue

### Para desplegar en Firebase Hosting:
```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar proyecto (solo la primera vez)
firebase init hosting

# Construir y desplegar
npm run deploy
```

---

**¡Tu chatbot está listo para usar! 🎉**

**Proyecto Firebase:** chat-58b26  
**URL de la consola:** https://console.firebase.google.com/project/chat-58b26 