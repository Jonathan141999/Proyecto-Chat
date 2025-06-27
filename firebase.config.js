// Configuración específica para el proyecto chat-58b26
// Este archivo contiene la configuración actualizada para tu proyecto de Firebase

const firebaseConfig = {
  apiKey: "AIzaSyAqYxNCUwi2ezqivzZjavysUbxkpWG_HsI",
  authDomain: "chat-58b26.firebaseapp.com",
  projectId: "chat-58b26",
  storageBucket: "chat-58b26.firebasestorage.app",
  messagingSenderId: "303868298879",
  appId: "1:303868298879:web:c3b7a903c5861079bda14a",
  measurementId: "G-58WLXJKGJM"
};

// Configuración de Firestore para el proyecto
const firestoreConfig = {
  projectId: "chat-58b26",
  collection: "conversations"
};

// Configuración de Analytics
const analyticsConfig = {
  measurementId: "G-58WLXJKGJM",
  enabled: true
};

module.exports = {
  firebaseConfig,
  firestoreConfig,
  analyticsConfig
};

/*
INSTRUCCIONES PARA CONFIGURAR EL PROYECTO:

1. VERIFICAR FIRESTORE:
   - Ve a https://console.firebase.google.com/project/chat-58b26
   - Navega a Firestore Database
   - Si no está habilitado, haz clic en "Crear base de datos"
   - Selecciona "Comenzar en modo de prueba"
   - Elige una ubicación (recomendado: us-central1)

2. CONFIGURAR REGLAS DE FIRESTORE:
   - En Firestore Database > Reglas, usa estas reglas:
   
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /conversations/{document} {
         allow read, write: if true;
       }
     }
   }

3. HABILITAR ANALYTICS:
   - Ve a Analytics en la consola de Firebase
   - Si no está habilitado, sigue las instrucciones para activarlo

4. VERIFICAR HOSTING (opcional):
   - Ve a Hosting en la consola
   - Si quieres desplegar la app, sigue las instrucciones de configuración

5. PROBAR LA CONEXIÓN:
   - Ejecuta: npm start
   - Abre http://localhost:3000
   - Prueba el chatbot y verifica que las conversaciones se guarden

ESTRUCTURA DE DATOS ESPERADA:

Colección: conversations
Documentos: {
  tramite: string,
  conversationPath: array,
  result: string,
  timestamp: timestamp,
  createdAt: string
}

ANALYTICS EVENTS:

- tramite_selected: Cuando se selecciona un trámite
- conversation_started: Cuando inicia una conversación
- conversation_saved: Cuando se guarda una conversación
- stats_viewed: Cuando se ven las estadísticas
- firebase_error: Cuando ocurre un error

*/ 