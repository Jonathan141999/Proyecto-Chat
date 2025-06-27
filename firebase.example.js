// Ejemplo de configuración de Firebase
// Copia este archivo como src/firebase/config.js y reemplaza con tus credenciales

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

/*
INSTRUCCIONES PARA CONFIGURAR FIREBASE:

1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto o selecciona uno existente
3. En la configuración del proyecto, ve a "Configuración del proyecto"
4. En la pestaña "General", desplázate hacia abajo hasta "Tus apps"
5. Haz clic en el ícono de web (</>) para agregar una app web
6. Dale un nombre a tu app (ej: "tramites-municipales")
7. Copia las credenciales que aparecen
8. Reemplaza los valores en el objeto firebaseConfig arriba

CONFIGURACIÓN DE FIRESTORE:

1. En la consola de Firebase, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Elige una ubicación para tu base de datos
5. Haz clic en "Listo"

REGLAS DE SEGURIDAD (opcional):

En Firestore Database > Reglas, puedes usar estas reglas básicas:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{document} {
      allow read, write: if true; // Permite lectura y escritura para todos
    }
  }
}

Para producción, deberías usar reglas más restrictivas.
*/ 