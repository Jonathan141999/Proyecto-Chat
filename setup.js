#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Configuración del Chatbot de Trámites Municipales');
console.log('==================================================\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    console.log('📋 Verificando dependencias...');
    
    // Verificar si package.json existe
    if (!fs.existsSync('package.json')) {
      console.log('❌ No se encontró package.json. Asegúrate de estar en el directorio correcto.');
      return;
    }

    console.log('✅ package.json encontrado\n');

    // Instalar dependencias
    console.log('📦 Instalando dependencias...');
    const { execSync } = require('child_process');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas\n');

    // Configuración de Firebase
    console.log('🔥 Configuración de Firebase');
    console.log('Para continuar, necesitas crear un proyecto en Firebase:');
    console.log('1. Ve a https://console.firebase.google.com/');
    console.log('2. Crea un nuevo proyecto');
    console.log('3. Habilita Firestore Database');
    console.log('4. Obtén las credenciales de configuración\n');

    const useFirebase = await question('¿Quieres configurar Firebase ahora? (s/n): ');
    
    if (useFirebase.toLowerCase() === 's' || useFirebase.toLowerCase() === 'si') {
      console.log('\n📝 Ingresa las credenciales de Firebase:');
      
      const apiKey = await question('API Key: ');
      const authDomain = await question('Auth Domain: ');
      const projectId = await question('Project ID: ');
      const storageBucket = await question('Storage Bucket: ');
      const messagingSenderId = await question('Messaging Sender ID: ');
      const appId = await question('App ID: ');

      // Crear archivo de configuración
      const configContent = `import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
`;

      fs.writeFileSync('src/firebase/config.js', configContent);
      console.log('✅ Configuración de Firebase guardada\n');
    } else {
      console.log('\n⚠️  Recuerda configurar Firebase manualmente antes de usar la aplicación');
      console.log('Copia firebase.example.js a src/firebase/config.js y actualiza las credenciales\n');
    }

    // Verificar estructura de archivos
    console.log('📁 Verificando estructura de archivos...');
    const requiredFiles = [
      'src/App.js',
      'src/components/Chatbot.js',
      'src/data/tramites.js',
      'src/services/firebaseService.js'
    ];

    let allFilesExist = true;
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} - FALTANTE`);
        allFilesExist = false;
      }
    });

    if (!allFilesExist) {
      console.log('\n❌ Algunos archivos requeridos no existen. Verifica la estructura del proyecto.');
      return;
    }

    console.log('\n✅ Todos los archivos requeridos están presentes\n');

    // Instrucciones finales
    console.log('🎉 ¡Configuración completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Si no configuraste Firebase, hazlo ahora');
    console.log('2. Ejecuta: npm start');
    console.log('3. Abre http://localhost:3000 en tu navegador');
    console.log('\n📚 Documentación:');
    console.log('- README.md para más información');
    console.log('- firebase.example.js para configuración de Firebase');
    console.log('\n🚀 ¡Disfruta tu chatbot de trámites municipales!');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    rl.close();
  }
}

setup(); 