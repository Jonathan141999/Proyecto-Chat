import { db, analytics } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, doc, updateDoc, getDoc, limit } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

// Generar número de caso automático
export const generateCaseNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const year = new Date().getFullYear();
  return `CAS-${year}-${timestamp}-${random}`;
};

// Crear nuevo caso
export const createNewCase = async (userData) => {
  try {
    const caseNumber = generateCaseNumber();
    const casesRef = collection(db, 'cases');
    // Normaliza la cédula
    const cleanCedula = String(userData.cedula).trim();
    const newCase = {
      caseNumber,
      userData: { ...userData, cedula: cleanCedula },
      tramites: [],
      status: 'active',
      createdAt: serverTimestamp(),
      lastInteraction: serverTimestamp(),
      totalTramites: 0,
      notes: '',
      isActive: true
    };
    const docRef = await addDoc(casesRef, newCase);
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'case_created', {
        case_number: caseNumber,
        user_cedula: cleanCedula
      });
    }
    return { caseId: docRef.id, caseNumber };
  } catch (error) {
    console.error('Error al crear caso:', error);
    throw error;
  }
};

// Buscar caso por número
export const searchCaseByNumber = async (caseNumber) => {
  try {
    const casesRef = collection(db, 'cases');
    const q = query(casesRef, where('caseNumber', '==', caseNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const caseData = querySnapshot.docs[0].data();
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'case_searched', {
        case_number: caseNumber,
        found: true
      });
    }
    
    return { id: querySnapshot.docs[0].id, ...caseData };
  } catch (error) {
    console.error('Error al buscar caso:', error);
    throw error;
  }
};

// Buscar usuario por cédula (caso más reciente)
export const searchUserByCedula = async (cedula) => {
  try {
    const cleanCedula = String(cedula).trim();
    const casesRef = collection(db, 'cases');
    const q = query(
      casesRef, 
      where('userData.cedula', '==', cleanCedula),
      orderBy('lastInteraction', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Para propósitos de prueba, crear un caso de demostración si la cédula es "1234567890"
      if (cleanCedula === '1234567890') {
        console.log('Creando caso de demostración para cédula de prueba...');
        return await createDemoCase(cleanCedula);
      }
      return null;
    }
    
    const caseDoc = querySnapshot.docs[0];
    const caseData = { id: caseDoc.id, ...caseDoc.data() };
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'user_searched', {
        user_cedula: cleanCedula,
        found: true
      });
    }
    
    return caseData;
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    throw error;
  }
};

// Obtener todos los casos de un usuario por cédula
export const getUserCasesByCedula = async (cedula) => {
  try {
    const casesRef = collection(db, 'cases');
    const q = query(
      casesRef, 
      where('userData.cedula', '==', cedula),
      orderBy('lastInteraction', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const cases = [];
    querySnapshot.forEach((doc) => {
      cases.push({ id: doc.id, ...doc.data() });
    });
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'user_cases_loaded', {
        user_cedula: cedula,
        cases_count: cases.length
      });
    }
    
    return cases;
  } catch (error) {
    console.error('Error al obtener casos del usuario:', error);
    throw error;
  }
};

// Actualizar datos del usuario en caso existente
export const updateUserDataInCase = async (caseId, updatedUserData) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    await updateDoc(caseRef, {
      userData: updatedUserData,
      lastInteraction: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error al actualizar datos del usuario:', error);
    throw error;
  }
};

// Cerrar caso (marcar como completado y cerrado)
export const closeCase = async (caseId) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    await updateDoc(caseRef, {
      status: 'closed',
      completedAt: serverTimestamp(),
      lastInteraction: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error al cerrar caso:', error);
    throw error;
  }
};

// Crear caso de demostración
export const createDemoCase = async (cedula) => {
  try {
    const caseNumber = generateCaseNumber();
    const casesRef = collection(db, 'cases');
    
    const demoCase = {
      caseNumber,
      userData: {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: cedula,
        telefono: '0987654321',
        correo: 'juan.perez@email.com'
      },
      tramites: [
        {
          id: 'licencia_conducir',
          nombre: 'Licencia de Conducir',
          status: 'completed',
          result: 'aprobado',
          completedAt: new Date(Date.now() - 86400000).toISOString() // 1 día atrás
        },
        {
          id: 'certificado_residencia',
          nombre: 'Certificado de Residencia',
          status: 'completed',
          result: 'aprobado',
          completedAt: new Date(Date.now() - 172800000).toISOString() // 2 días atrás
        }
      ],
      conversations: [
        {
          tramite: 'licencia_conducir',
          conversationPath: [
            { tramite: 'licencia_conducir' },
            { question: 1 },
            { answer: 'Sí, tengo todos los documentos' }
          ],
          result: 'aprobado',
          user: {
            nombre: 'Juan',
            apellido: 'Pérez',
            cedula: cedula
          },
          timestamp: new Date(Date.now() - 86400000),
          messages: [
            { type: 'bot', content: '¿Tienes todos los documentos requeridos?' },
            { type: 'user', content: 'Sí, tengo todos los documentos' },
            { type: 'bot', content: '¡Perfecto! Tu licencia ha sido aprobada.' }
          ]
        }
      ],
      status: 'active',
      createdAt: new Date(Date.now() - 172800000),
      lastInteraction: new Date(Date.now() - 86400000),
      totalTramites: 2,
      notes: 'Cliente frecuente, trámites completados sin problemas.',
      isActive: true
    };
    
    const docRef = await addDoc(casesRef, demoCase);
    return { id: docRef.id, ...demoCase };
  } catch (error) {
    console.error('Error al crear caso de demostración:', error);
    throw error;
  }
};

// Actualizar caso con nuevo trámite y conversación completa
export const updateCaseWithTramite = async (caseId, tramiteData, conversationData) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    const caseDoc = await getDoc(caseRef);
    
    if (!caseDoc.exists()) {
      throw new Error('Caso no encontrado');
    }
    
    const currentCase = caseDoc.data();
    const updatedTramites = [...currentCase.tramites, tramiteData];
    
    await updateDoc(caseRef, {
      tramites: updatedTramites,
      totalTramites: updatedTramites.length,
      lastInteraction: serverTimestamp(),
      conversations: [...(currentCase.conversations || []), conversationData]
    });
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'case_updated', {
        case_number: currentCase.caseNumber,
        tramite_id: tramiteData.id
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error al actualizar caso:', error);
    throw error;
  }
};

// Crear nuevo caso con datos existentes del usuario
export const createNewCaseWithExistingUser = async (userData, previousCaseNumber = null) => {
  try {
    const caseNumber = generateCaseNumber();
    const casesRef = collection(db, 'cases');
    
    const newCase = {
      caseNumber,
      userData,
      tramites: [],
      conversations: [],
      status: 'active',
      createdAt: serverTimestamp(),
      lastInteraction: serverTimestamp(),
      totalTramites: 0,
      notes: '',
      isActive: true,
      previousCase: previousCaseNumber // Referencia al caso anterior
    };
    
    const docRef = await addDoc(casesRef, newCase);
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'case_created_from_existing', {
        case_number: caseNumber,
        previous_case: previousCaseNumber,
        user_cedula: userData.cedula
      });
    }
    
    return { caseId: docRef.id, caseNumber };
  } catch (error) {
    console.error('Error al crear caso con usuario existente:', error);
    throw error;
  }
};

// Generar PDF del caso
export const generateCasePDF = async (caseData) => {
  try {
    // Aquí implementarías la lógica de generación de PDF
    // Por ahora retornamos un objeto con la información estructurada
    const pdfData = {
      caseNumber: caseData.caseNumber,
      userData: caseData.userData,
      tramites: caseData.tramites,
      conversations: caseData.conversations,
      createdAt: caseData.createdAt,
      lastInteraction: caseData.lastInteraction,
      status: caseData.status
    };
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'pdf_generated', {
        case_number: caseData.caseNumber
      });
    }
    
    return pdfData;
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};

// Actualizar estado del caso
export const updateCaseStatus = async (caseId, status) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    await updateDoc(caseRef, {
      status,
      lastInteraction: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error al actualizar estado del caso:', error);
    throw error;
  }
};

// Agregar nota al caso
export const addCaseNote = async (caseId, note) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    const caseDoc = await getDoc(caseRef);
    
    if (!caseDoc.exists()) {
      throw new Error('Caso no encontrado');
    }
    
    const currentCase = caseDoc.data();
    const updatedNotes = currentCase.notes ? `${currentCase.notes}\n${note}` : note;
    
    await updateDoc(caseRef, {
      notes: updatedNotes,
      lastInteraction: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error al agregar nota al caso:', error);
    throw error;
  }
};

// Obtener estadísticas de casos
export const getCaseStats = async () => {
  try {
    const casesRef = collection(db, 'cases');
    const querySnapshot = await getDocs(casesRef);
    
    const cases = [];
    querySnapshot.forEach((doc) => {
      cases.push(doc.data());
    });
    
    const stats = {
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'active').length,
      completedCases: cases.filter(c => c.status === 'completed').length,
      pendingCases: cases.filter(c => c.status === 'pending').length,
      averageTramitesPerCase: cases.length > 0 ? 
        cases.reduce((sum, c) => sum + c.totalTramites, 0) / cases.length : 0
    };
    
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas de casos:', error);
    throw error;
  }
};

// Guardar conversación en Firebase
export const saveConversation = async (conversationData) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    
    const conversationToSave = {
      ...conversationData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(conversationsRef, conversationToSave);
    console.log('Conversación guardada con ID:', docRef.id);
    
    // Track analytics event
    if (analytics) {
      logEvent(analytics, 'conversation_saved', {
        tramite: conversationData.tramite,
        result: conversationData.result
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar la conversación:', error);
    
    // Track error analytics
    if (analytics) {
      logEvent(analytics, 'conversation_error', {
        error_code: error.code,
        error_message: error.message
      });
    }
    
    throw error;
  }
};

// NUEVO: Actualizar conversación con la URL del PDF - COMENTADO
/*
export const updateConversationWithPdf = async (conversationId, pdfUrl) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, { pdfUrl });
    return true;
  } catch (error) {
    console.error('Error al actualizar la conversación con el PDF:', error);
    throw error;
  }
};
*/

// Obtener estadísticas de conversaciones
export const getConversationStats = async () => {
  try {
    const conversationsRef = collection(db, 'conversations');
    
    // Obtener todas las conversaciones
    const querySnapshot = await getDocs(conversationsRef);
    
    const conversations = [];
    querySnapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() });
    });
    
    // Calcular estadísticas
    const totalConversations = conversations.length;
    const tramitesStats = {};
    const resultsStats = {};
    
    conversations.forEach((conversation) => {
      // Estadísticas por trámite
      if (conversation.tramite) {
        tramitesStats[conversation.tramite] = (tramitesStats[conversation.tramite] || 0) + 1;
      }
      
      // Estadísticas por resultado
      if (conversation.result) {
        resultsStats[conversation.result] = (resultsStats[conversation.result] || 0) + 1;
      }
    });
    
    // Obtener conversaciones recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentConversations = conversations.filter(conv => {
      const convDate = new Date(conv.createdAt);
      return convDate >= sevenDaysAgo;
    });
    
    // Track analytics for stats view
    if (analytics) {
      logEvent(analytics, 'stats_viewed', {
        total_conversations: totalConversations,
        recent_conversations: recentConversations.length
      });
    }
    
    return {
      totalConversations,
      recentConversations: recentConversations.length,
      tramitesStats,
      resultsStats,
      averageConversationLength: calculateAverageConversationLength(conversations),
      mostCommonResults: getMostCommonResults(resultsStats),
      mostPopularTramites: getMostPopularTramites(tramitesStats)
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    
    // Track error analytics
    if (analytics) {
      logEvent(analytics, 'stats_error', {
        error_code: error.code,
        error_message: error.message
      });
    }
    
    throw error;
  }
};

// Calcular longitud promedio de conversaciones
const calculateAverageConversationLength = (conversations) => {
  if (conversations.length === 0) return 0;
  
  const totalSteps = conversations.reduce((sum, conv) => {
    return sum + (conv.conversationPath?.length || 0);
  }, 0);
  
  return Math.round(totalSteps / conversations.length);
};

// Obtener resultados más comunes
const getMostCommonResults = (resultsStats) => {
  return Object.entries(resultsStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([result, count]) => ({ result, count }));
};

// Obtener trámites más populares
const getMostPopularTramites = (tramitesStats) => {
  return Object.entries(tramitesStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tramite, count]) => ({ tramite, count }));
};

// Obtener conversaciones por trámite específico
export const getConversationsByTramite = async (tramiteId) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('tramite', '==', tramiteId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() });
    });
    
    // Track analytics
    if (analytics) {
      logEvent(analytics, 'tramite_viewed', {
        tramite_id: tramiteId,
        conversation_count: conversations.length
      });
    }
    
    return conversations;
  } catch (error) {
    console.error('Error al obtener conversaciones por trámite:', error);
    throw error;
  }
};

// Obtener conversaciones recientes
export const getRecentConversations = async (limit = 10) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      if (conversations.length < limit) {
        conversations.push({ id: doc.id, ...doc.data() });
      }
    });
    
    return conversations;
  } catch (error) {
    console.error('Error al obtener conversaciones recientes:', error);
    throw error;
  }
};

// Tracking functions
export const trackTramiteSelection = (tramiteId, tramiteName) => {
  if (analytics) {
    logEvent(analytics, 'tramite_selected', {
      tramite_id: tramiteId,
      tramite_name: tramiteName
    });
  }
};

export const trackConversationStart = (tramiteId) => {
  if (analytics) {
    logEvent(analytics, 'conversation_started', {
      tramite_id: tramiteId
    });
  }
};

export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error);
  
  if (analytics) {
    logEvent(analytics, 'firebase_error', {
      error_code: error.code,
      error_message: error.message
    });
  }
}; 