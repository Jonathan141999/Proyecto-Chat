import { db, analytics } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';

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

// NUEVO: Actualizar conversación con la URL del PDF
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

// Track tramite selection
export const trackTramiteSelection = (tramiteId, tramiteName) => {
  if (analytics) {
    logEvent(analytics, 'tramite_selected', {
      tramite_id: tramiteId,
      tramite_name: tramiteName
    });
  }
};

// Track conversation start
export const trackConversationStart = (tramiteId) => {
  if (analytics) {
    logEvent(analytics, 'conversation_started', {
      tramite_id: tramiteId
    });
  }
};

// Función para manejar errores de Firebase
export const handleFirebaseError = (error) => {
  // Track error analytics
  if (analytics) {
    logEvent(analytics, 'firebase_error', {
      error_code: error.code,
      error_message: error.message
    });
  }
  
  switch (error.code) {
    case 'permission-denied':
      return 'No tienes permisos para realizar esta acción.';
    case 'unavailable':
      return 'El servicio no está disponible en este momento.';
    case 'network-request-failed':
      return 'Error de conexión. Verifica tu internet.';
    case 'not-found':
      return 'El recurso solicitado no fue encontrado.';
    case 'already-exists':
      return 'El recurso ya existe.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}; 