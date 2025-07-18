import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Toast, ToastContainer, Alert } from 'react-bootstrap';
import { tramites, resultados } from '../data/tramites';
import { 
  saveConversation, 
  updateConversationWithPdf, 
  trackTramiteSelection, 
  trackConversationStart,
  createNewCase,
  createNewCaseWithExistingUser,
  updateCaseWithTramite,
  searchCaseByNumber,
  searchUserByCedula,
  closeCase,
  updateUserDataInCase, // <-- importar la función
  upsertUsuarioByCedula, // <-- nuevo
  getUsuarioByCedula // <-- nuevo
} from '../services/firebaseService';
import CaseSearch from './CaseSearch';
import CaseConversation from './CaseConversation';
import CedulaSearch from './CedulaSearch';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Chatbot.css';

const userQuestions = [
  { key: 'nombre', label: '¿Cuál es tu nombre?' },
  { key: 'apellido', label: '¿Cuál es tu apellido?' },
  { key: 'telefono', label: '¿Cuál es tu número telefónico?' },
  { key: 'correo', label: '¿Cuál es tu correo electrónico?' },
];

const initialUserData = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  correo: '',
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [currentTramite, setCurrentTramite] = useState(null);
  const [conversationPath, setConversationPath] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showContinueOptions, setShowContinueOptions] = useState(false);
  const [userData, setUserData] = useState(initialUserData);
  const [userStep, setUserStep] = useState(0); // 0: pidiendo datos, 1: trámites
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const messagesEndRef = useRef(null);
  
  // Estados para el sistema de casos
  const [currentCase, setCurrentCase] = useState(null);
  const [appMode, setAppMode] = useState('welcome'); // welcome, case-search, chat, case-conversation
  const [caseNumber, setCaseNumber] = useState('');
  const [selectedCaseForConversation, setSelectedCaseForConversation] = useState(null);
  const [chatStep, setChatStep] = useState('welcome'); // welcome, cedula-choice, cedula-input, user-found, new-user, data-collection, tramites
  const [pendingCedula, setPendingCedula] = useState('');
  const [existingUserData, setExistingUserData] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // const [pdfUploading, setPdfUploading] = useState(false);
  // const [pdfUrl, setPdfUrl] = useState(null);
  // const [pdfError, setPdfError] = useState('');
  // const [conversationId, setConversationId] = useState(null);
  // const [selectedPdf, setSelectedPdf] = useState(null);

  // Función para validar nombres y apellidos
  function isNombreValido(str) {
    const limpio = str.trim();
    if (limpio.length < 4) return false;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(limpio)) return false;
    // Al menos una vocal y una consonante
    if (!/[aeiouáéíóúAEIOUÁÉÍÓÚ]/.test(limpio)) return false;
    if (!/[bcdfghjklmnñpqrstvwxyzBCDFGHJKLMNÑPQRSTVWXYZ]/.test(limpio)) return false;
    // No permitir secuencias de la misma letra
    if (/^(.)\1+$/.test(limpio.replace(/ /g, ''))) return false;
    // No permitir patrones repetitivos tipo 'dadad', 'sasasa', 'mimimi'
    // Detecta repeticiones de sílabas de 2 letras
    const sinEspacios = limpio.replace(/ /g, '').toLowerCase();
    for (let size = 2; size <= 3; size++) {
      if (sinEspacios.length >= size * 2) {
        const patron = sinEspacios.slice(0, size);
        let repetido = true;
        for (let i = 0; i < sinEspacios.length; i += size) {
          if (sinEspacios.slice(i, i + size) !== patron) {
            repetido = false;
            break;
          }
        }
        if (repetido) return false;
      }
    }
    // Detecta alternancia tipo 'dadad', 'sasasa', 'mimimi'
    if (/^(..)+\1$/.test(sinEspacios)) return false;
    return true;
  }

  // Reemplazo la función validateInput para validar cada campo correctamente:
  const validateInput = (key, value) => {
    if (!value.trim()) return 'Este campo es obligatorio';
    if (key === 'cedula' && !/^[0-9]{10}$/.test(value)) return 'La cédula debe tener exactamente 10 números';
    if (key === 'nombre' && !isNombreValido(value)) return 'Ingresa un nombre válido (solo letras, al menos una vocal y una consonante, sin repeticiones)';
    if (key === 'apellido' && !isNombreValido(value)) return 'Ingresa un apellido válido (solo letras, al menos una vocal y una consonante, sin repeticiones)';
    if (key === 'telefono' && !/^09[0-9]{8}$/.test(value)) return 'El teléfono debe tener exactamente 10 números y empezar con 09';
    if (key === 'correo' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Correo electrónico inválido';
    return '';
  };

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Al montar, inicia el flujo de preguntas
  useEffect(() => {
    if (messages.length === 0 && appMode === 'chat' && chatStep === 'data-collection') {
      setMessages([
        {
          id: Date.now(),
          type: 'bot',
          content: userQuestions[0].label,
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length, appMode, chatStep]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Si el usuario está en el flujo de registro y no ha completado todos los datos
      if (
        (chatStep === 'new-user-cedula' || chatStep === 'data-collection') &&
        (!userData.nombre || !userData.apellido || !userData.telefono || !userData.correo)
      ) {
        e.preventDefault();
        e.returnValue = 'Tienes un registro incompleto. Si recargas, perderás el progreso. ¿Estás seguro?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chatStep, userData]);

  // Manejar input del usuario para datos personales
  const handleUserInput = (e) => {
    setInputValue(e.target.value);
    setInputError('');
  };

  // Mantengo solo una función handleUserInputSubmit, con toda la lógica de:
  // - cedula-input
  // - new-user-cedula
  // - data-update-field
  // - data-collection
  // y elimino cualquier declaración duplicada.
  // const handleUserInputSubmit = async (e) => {
  //   e.preventDefault();

  //   if (chatStep === 'cedula-input') {
  //     if (!inputValue.trim()) {
  //       setInputError('Por favor ingresa tu número de cédula');
  //       return;
  //     }
  //     if (!/^[0-9]+$/.test(inputValue)) {
  //       setInputError('La cédula debe contener solo números');
  //       return;
  //     }
  //     await handleCedulaInput(inputValue.trim());
  //     setInputValue('');
  //     setInputError('');
  //     return;
  //   }

  //   if (chatStep === 'new-user-cedula') {
  //     if (!inputValue.trim()) {
  //       setInputError('Por favor ingresa tu número de cédula');
  //       return;
  //     }
  //     if (!/^[0-9]+$/.test(inputValue)) {
  //       setInputError('La cédula debe contener solo números');
  //       return;
  //     }
  //     // Agregar respuesta del usuario al chat
  //     const userMsg = {
  //       id: Date.now(),
  //       type: 'user',
  //       content: inputValue,
  //       timestamp: new Date(),
  //     };
  //     setMessages((prev) => [...prev, userMsg]);
  //     setUserData({ ...initialUserData, cedula: inputValue.trim() });
  //     setInputValue('');
  //     setInputError('');
  //     setChatStep('data-collection');
  //     setUserStep(0);
  //     setTimeout(() => {
  //       const botMessage = {
  //         id: Date.now() + 1,
  //         type: 'bot',
  //         content: userQuestions[0].label,
  //         timestamp: new Date(),
  //       };
  //       setMessages((prev) => [...prev, botMessage]);
  //     }, 400);
  //     return;
  //   }
    
  //   if (chatStep === 'data-update-field') {
  //     // Actualiza solo el campo seleccionado
  //     let newUserData = { ...userData };
  //     const currentQuestion = userQuestions[userStep];
  //     const error = validateInput(currentQuestion.key, inputValue);
  //     if (error) {
  //       setInputError(error);
  //       return;
  //     }
  //     // Agregar respuesta del usuario al chat
  //     const userMsg = {
  //       id: Date.now(),
  //       type: 'user',
  //       content: inputValue,
  //       timestamp: new Date(),
  //     };
  //     setMessages((prev) => [...prev, userMsg]);
  //     // Guardar dato actualizado
  //     newUserData[currentQuestion.key] = inputValue;
  //     setUserData(newUserData);
  //     setInputValue('');
  //     setInputError('');
  //     // Preguntar si desea actualizar otro campo
  //     setTimeout(() => {
  //       const botMessage = {
  //         id: Date.now() + 1,
  //         type: 'bot',
  //         content: '¿Deseas actualizar otro dato?',
  //         options: [
  //           { texto: 'Sí', action: 'update_more' },
  //           { texto: 'No', action: 'finish_update' }
  //         ],
  //         timestamp: new Date(),
  //         messageType: 'update-more-choice'
  //       };
  //       setMessages((prev) => [...prev, botMessage]);
  //       setChatStep('update-more-choice');
  //     }, 500);
  //     return;
  //   }

  //   if (chatStep === 'data-collection') {
  //     let nextStep = userStep;
  //     let newUserData = { ...userData };
  //     const currentQuestion = userQuestions[userStep];
  //     const error = validateInput(currentQuestion.key, inputValue);
  //     if (error) {
  //       setInputError(error);
  //       return;
  //     }
  //     // Agregar respuesta del usuario al chat
  //     const userMsg = {
  //       id: Date.now(),
  //       type: 'user',
  //       content: inputValue,
  //       timestamp: new Date(),
  //     };
  //     setMessages((prev) => [...prev, userMsg]);
  //     // Guardar dato
  //     newUserData[currentQuestion.key] = inputValue;
  //     setUserData(newUserData);
  //     setInputValue('');
  //     setInputError('');
  //     // Siguiente pregunta o pasar a trámites
  //     let nextIndex = nextStep + 1;
  //     if (nextIndex < userQuestions.length) {
  //       setTimeout(() => {
  //         setMessages((prev) => [
  //           ...prev,
  //           {
  //             id: Date.now() + 1,
  //             type: 'bot',
  //             content: userQuestions[nextIndex].label,
  //             timestamp: new Date(),
  //           },
  //         ]);
  //         setUserStep(nextIndex);
  //       }, 400);
  //     } else {
  //       // Crear nuevo caso y mostrar trámites
  //       try {
  //         const { caseId, caseNumber: newCaseNumber } = await createNewCase(newUserData);
  //         setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
  //         setCaseNumber(newCaseNumber);
  //         setChatStep('tramites');
  //         setTimeout(() => {
  //           setMessages((prev) => [
  //             ...prev,
  //             {
  //               id: Date.now() + 2,
  //               type: 'bot',
  //               content: `¡Hola ${newUserData.nombre} ${newUserData.apellido}! ✅ Caso creado: ${newCaseNumber}`,
  //               timestamp: new Date(),
  //             },
  //             {
  //               id: Date.now() + 3,
  //               type: 'bot',
  //               content: 'Por favor, selecciona el trámite que deseas realizar:',
  //               timestamp: new Date(),
  //             },
  //           ]);
  //           setUserStep('tramites');
  //         }, 400);
  //       } catch (error) {
  //         console.error('Error al crear caso:', error);
  //         setChatStep('tramites');
  //         setTimeout(() => {
  //           setMessages((prev) => [
  //             ...prev,
  //             {
  //               id: Date.now() + 2,
  //               type: 'bot',
  //               content: `¡Hola ${newUserData.nombre} ${newUserData.apellido}! Por favor, selecciona el trámite que deseas realizar.`,
  //               timestamp: new Date(),
  //             },
  //           ]);
  //           setUserStep('tramites');
  //         }, 400);
  //       }
  //     }
  //   }
  // };

  const startConversation = (tramiteId) => {
    const tramite = tramites[tramiteId];
    const firstQuestion = tramite.preguntas[0];
    setCurrentTramite(tramite);
    setConversationPath([{ tramite: tramiteId, question: 1, questionText: firstQuestion.pregunta }]);
    trackTramiteSelection(tramiteId, tramite.nombre);
    trackConversationStart(tramiteId);
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: `¡Te ayudo con el trámite de "${tramite.nombre}". ${tramite.descripcion}`,
      timestamp: new Date(),
    };
    const questionMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: firstQuestion.pregunta,
      options: firstQuestion.opciones,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage, questionMessage]);
  };

  const handleOptionSelect = async (option) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: option.texto,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setConversationPath((prev) => [...prev, { answer: option.texto }]);
    if (typeof option.siguiente === 'string') {
      const resultado = resultados[option.siguiente];
      const resultMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: resultado.titulo,
        details: resultado.mensaje,
        steps: resultado.pasos,
        resultType: resultado.tipo,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, resultMessage]);
      setIsComplete(true);
      
      // Actualizar caso con el trámite completado y conversación completa
      if (currentCase) {
        try {
          const conversationData = {
            tramite: currentTramite.id,
            conversationPath: [...conversationPath, { answer: option.texto }],
            result: option.siguiente,
            user: userData,
            timestamp: new Date(),
            messages: messages // Guardar todos los mensajes de la conversación
          };
          
          await updateCaseWithTramite(currentCase.id, {
            id: currentTramite.id,
            nombre: currentTramite.nombre,
            status: 'completed',
            result: option.siguiente,
            completedAt: new Date().toISOString()
          }, conversationData);
        } catch (error) {
          console.error('Error al actualizar caso:', error);
        }
      }
      
      // Mostrar opciones de continuar después de un delay
      setTimeout(() => {
        const continueMessage = {
          id: Date.now() + 2,
          type: 'bot',
          content: '¿Te gustaría realizar algún otro trámite o deseas finalizar el chat?',
          options: [
            { texto: 'Realizar otro trámite', action: 'continue' },
            { texto: 'Finalizar chat', action: 'finish' }
          ],
          timestamp: new Date(),
          messageType: 'continue-options'
        };
        setMessages((prev) => [...prev, continueMessage]);
        setShowContinueOptions(true);
      }, 1000);
      
      try {
        const convId = await saveConversation({
          tramite: currentTramite.id,
          conversationPath: [...conversationPath, { answer: option.texto }],
          result: option.siguiente,
          user: userData,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error al guardar la conversación:', error);
      }
      return;
    }
    const nextQuestion = currentTramite.preguntas.find((q) => q.id === option.siguiente);
    if (nextQuestion) {
      setConversationPath((prev) => [...prev, { question: nextQuestion.id, questionText: nextQuestion.pregunta }]);
      const questionMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: nextQuestion.pregunta,
        options: nextQuestion.opciones,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, questionMessage]);
    }
  };

  const handleContinueOption = async (action) => {
    if (action === 'continue') {
      // Crear un nuevo caso inmediatamente con los datos actuales del usuario
      const continueMessage = {
        id: Date.now(),
        type: 'user',
        content: 'Realizar otro trámite',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, continueMessage]);
      setTimeout(async () => {
        // Volver a cargar los datos del usuario desde la colección 'usuarios' usando la cédula
        let usuarioActualizado = userData;
        if (userData && userData.cedula) {
          usuarioActualizado = await getUsuarioByCedula(userData.cedula) || userData;
        }
        // Cerrar el caso actual antes de crear uno nuevo
        if (currentCase && currentCase.id) {
          try {
            await closeCase(currentCase.id);
            console.log('Caso anterior cerrado:', currentCase.id);
          } catch (error) {
            console.error('Error al cerrar el caso anterior:', error);
          }
        }
        // Crear un nuevo caso con la cédula del usuario actual
        const { caseId, caseNumber: newCaseNumber } = await createNewCase({ cedula: usuarioActualizado.cedula });
        setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
        setCaseNumber(newCaseNumber);
        setUserData(usuarioActualizado);
        setChatStep('tramites');
        const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${getNombreSeguro(usuarioActualizado)} ${getApellidoSeguro(usuarioActualizado)}. Caso: ${newCaseNumber}`,
            timestamp: new Date(),
          };
          const tramitesMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: '¿Qué trámite te gustaría realizar?',
            options: tramiteOptions,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage, tramitesMessage]);
          setCurrentTramite(null);
          setIsComplete(false);
          setUserStep('tramites');
        }, 500);
      }, 500);
    } else if (action === 'finish') {
      // Finalizar chat
      const finishMessage = {
        id: Date.now(),
        type: 'user',
        content: 'Finalizar chat',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, finishMessage]);
      
      // Cerrar el caso actual
      if (currentCase) {
        try {
          await closeCase(currentCase.id);
        } catch (error) {
          console.error('Error al cerrar caso:', error);
        }
      }
      
      setTimeout(async () => {
        // Volver a cargar los datos del usuario desde la colección 'usuarios' usando la cédula
        let nombre = '';
        if (userData && userData.cedula) {
          const usuarioActualizado = await getUsuarioByCedula(userData.cedula);
          if (usuarioActualizado && usuarioActualizado.nombre) {
            nombre = usuarioActualizado.nombre;
          }
        }
        const goodbyeMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `¡Gracias por usar nuestro asistente${nombre ? ', ' + nombre : ''}! Ha sido un placer ayudarte. Si necesitas más información, no dudes en volver. ¡Que tengas un excelente día! 👋`,
          timestamp: new Date(),
          messageType: 'goodbye-message'
        };
        setMessages((prev) => [...prev, goodbyeMessage]);
        
        // Redirigir a la pantalla de bienvenida después de mostrar el mensaje de despedida
        setTimeout(() => {
          goBackToWelcome();
        }, 3000);
      }, 500);
    }
  };

  const handleDataChoice = async (choice) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: choice === 'same_data' ? 'Usar mismos datos' : 'Ingresar nuevos datos',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);
    
    if (choice === 'same_data') {
      // Crear nuevo caso con datos existentes
      try {
        // Recargar los datos del usuario desde la colección 'usuarios' usando la cédula
        let usuarioActualizado = userData;
        if (userData && userData.cedula) {
          usuarioActualizado = await getUsuarioByCedula(userData.cedula) || userData;
        }
        const { caseId, caseNumber: newCaseNumber } = await createNewCaseWithExistingUser(usuarioActualizado, currentCase?.caseNumber);
        setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
        setUserData(usuarioActualizado);
        setChatStep('tramites');
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${getNombreSeguro(usuarioActualizado)} ${getApellidoSeguro(usuarioActualizado)}. Nuevo caso creado: ${newCaseNumber}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setTimeout(() => {
            const tramitesMessage = {
              id: Date.now() + 2,
              type: 'bot',
              content: '¿Qué trámite te gustaría realizar?',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, tramitesMessage]);
          }, 1000);
          setCurrentTramite(null);
          setIsComplete(false);
          setUserStep('tramites');
        }, 500);
      } catch (error) {
        console.error('Error al crear nuevo caso:', error);
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: 'Perfecto! Selecciona el trámite que deseas realizar:',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setCurrentTramite(null);
          setIsComplete(false);
          setUserStep('tramites');
        }, 500);
      }
      return;
    }
    // Resetear datos y comenzar nuevo caso
    setUserData(initialUserData);
    setUserStep(0);
    setCurrentCase(null);
    setCaseNumber('');
    setCurrentTramite(null);
    setIsComplete(false);
    setChatStep('data-collection'); // <-- Corrige el flujo para mostrar solo las preguntas
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: userQuestions[0].label,
        timestamp: new Date(),
      };
      setMessages([botMessage]);
    }, 500);
  };

  const resetConversation = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: userQuestions[0].label,
        timestamp: new Date(),
      },
    ]);
    setCurrentTramite(null);
    setConversationPath([]);
    setIsComplete(false);
    setShowContinueOptions(false);
    setUserStep(0);
    setUserData(initialUserData);
    setInputValue('');
    setInputError('');
    setCurrentCase(null);
    setCaseNumber('');
    setChatStep('welcome');
    setPendingCedula('');
    setExistingUserData(null);
  };

  // Funciones para manejar los diferentes modos de la aplicación
  const handleWelcomeOption = (option) => {
    switch (option) {
      case 'new_case':
        setAppMode('chat');
        setChatStep('cedula-choice');
        setMessages([
          {
            id: Date.now(),
            type: 'bot',
            content: '¡Perfecto! Para comenzar necesito verificar tu identidad. ¿Ya tienes una cédula registrada en nuestro sistema o eres un nuevo usuario?',
            options: [
              { texto: 'Cédula Existente', action: 'existing_cedula' },
              { texto: 'Soy Nuevo', action: 'new_user' }
            ],
            timestamp: new Date(),
            messageType: 'cedula-choice'
          }
        ]);
        break;
      case 'search_case':
        setAppMode('case-search');
        break;
      case 'my_cases':
        setAppMode('cedula-search');
        break;
      default:
        break;
    }
  };

  const handleCaseFound = (caseData) => {
    setSelectedCaseForConversation(caseData);
    setAppMode('case-conversation');
  };

  // Reemplazo handleCaseSelected para manejar casos activos y cerrados:
  const handleCaseSelected = (caseData) => {
    setSelectedCaseForConversation(caseData);
    if (caseData.status === 'active') {
      // Caso activo: pasar a chat y mostrar opciones de trámite
      setCurrentCase({ id: caseData.id, caseNumber: caseData.caseNumber });
      setUserData(caseData.userData);
      setAppMode('chat');
      // Obtener las opciones de trámites disponibles
      const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
      setMessages([
        {
          id: Date.now(),
          type: 'bot',
          content: `¡Continuando con el caso: ${caseData.caseNumber}!`,
          timestamp: new Date(),
        },
        {
          id: Date.now() + 1,
          type: 'bot',
          content: '¿Qué trámite te gustaría realizar?',
          options: tramiteOptions,
          timestamp: new Date(),
        },
      ]);
      setUserStep('tramites');
      setChatStep('tramites');
    } else {
      // Caso cerrado: solo mostrar detalles, no permitir continuar
      setAppMode('case-conversation');
    }
  };

  const goBackToWelcome = () => {
    setAppMode('welcome');
    resetConversation();
    setSelectedCaseForConversation(null);
  };



  // Manejar opciones de cédula
  const handleCedulaChoice = async (choice) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: choice === 'existing_cedula' ? 'Cédula Existente' : 'Soy Nuevo',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);

    if (choice === 'existing_cedula') {
      setChatStep('cedula-input');
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Por favor, ingresa tu número de cédula:',
          timestamp: new Date(),
          messageType: 'cedula-input'
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    } else {
      // Para 'Soy Nuevo', primero pide la cédula
      setChatStep('new-user-cedula');
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Por favor, ingresa tu número de cédula:',
          timestamp: new Date(),
          messageType: 'cedula-input'
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    }
  };

  // Modifica handleCedulaInput para mostrar los datos encontrados y opciones
  const handleCedulaInput = async (cedula) => {
    const cedulaMessage = {
      id: Date.now(),
      type: 'user',
      content: cedula,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cedulaMessage]);

    if (chatStep === 'cedula-input') {
      // Buscar usuario existente en la colección 'usuarios'
      try {
        const usuario = await getUsuarioByCedula(cedula);
        if (usuario) {
          setUserData(usuario);
          setExistingUserData(usuario); // <-- Asegura que existingUserData siempre tenga el usuario encontrado
          setCurrentCase({ cedula });
          console.log('Usuario encontrado en colección usuarios:', usuario);
          setChatStep('user-found');
          setTimeout(() => {
            const botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: `¡Usuario encontrado!\n\nNombre: ${usuario.nombre}\nApellido: ${usuario.apellido}\nTeléfono: ${usuario.telefono}\nCorreo: ${usuario.correo}`,
              options: [
                { texto: 'Usar estos datos', action: 'use_existing' },
                { texto: 'Actualizar mis datos', action: 'update_data' }
              ],
              timestamp: new Date(),
              messageType: 'user-found'
            };
            setMessages((prev) => [...prev, botMessage]);
          }, 500);
        } else {
          setChatStep('cedula-input');
          setTimeout(() => {
            const botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: '❌ No se encontró ningún usuario con esa cédula. Si eres nuevo, selecciona "Soy Nuevo".',
              timestamp: new Date(),
              messageType: 'error-message'
            };
            setMessages((prev) => [...prev, botMessage]);
          }, 500);
        }
      } catch (error) {
        setChatStep('cedula-input');
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: '❌ Hubo un error al buscar tu cédula. Por favor, intenta de nuevo más tarde o contacta soporte.',
            timestamp: new Date(),
            messageType: 'error-message'
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 500);
        return;
      }
    } else if (chatStep === 'new-user-cedula') {
      // Nuevo usuario
      setUserData({ ...initialUserData, cedula });
      setChatStep('data-collection');
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: userQuestions[0].label,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    }
  };

  // Manejar opciones de usuario encontrado
  const handleUserFoundChoice = async (choice) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: choice === 'use_existing' ? 'Usar datos existentes' : 'Actualizar mis datos',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);

    if (choice === 'use_existing') {
      // Usar datos existentes y crear nuevo caso
      try {
        // Si existingUserData es null, usa userData o consulta a Firestore
        let usuarioActualizado = existingUserData;
        let cedula = '';
        if (!usuarioActualizado) {
          usuarioActualizado = userData;
        }
        if (!usuarioActualizado || !usuarioActualizado.cedula) {
          // Si aún no hay datos, intenta obtener la cédula del estado actual del caso
          cedula = currentCase && currentCase.cedula ? currentCase.cedula : '';
          if (cedula) {
            const usuarioBD = await getUsuarioByCedula(cedula);
            if (usuarioBD) {
              usuarioActualizado = usuarioBD;
            }
          }
        } else {
          cedula = usuarioActualizado.cedula;
        }
        if (!usuarioActualizado || !cedula) {
          // Si aún no hay datos válidos, muestra error
          setTimeout(() => {
            const botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: 'No se encontraron datos válidos del usuario. Intenta de nuevo.',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
          }, 500);
          return;
        }
        const { caseId, caseNumber: newCaseNumber } = await createNewCaseWithExistingUser({ cedula });
        setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
        setUserData(usuarioActualizado);
        setChatStep('tramites');
        const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${getNombreSeguro(usuarioActualizado)} ${getApellidoSeguro(usuarioActualizado)}. Nuevo caso creado: ${newCaseNumber}`,
            timestamp: new Date(),
          };
          const tramitesMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: '¿Qué trámite te gustaría realizar?',
            options: tramiteOptions,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage, tramitesMessage]);
          setCurrentTramite(null);
          setIsComplete(false);
          setUserStep('tramites');
        }, 500);
      } catch (error) {
        console.error('Error al crear caso:', error);
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${getNombreSeguro(existingUserData)} ${getApellidoSeguro(existingUserData)}. ¿Qué trámite te gustaría realizar?`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 500);
      }
      return;
    } else {
      // Actualizar datos
      setChatStep('data-update');
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Vamos a actualizar tus datos. ¿Qué información te gustaría cambiar?',
          options: [
            { texto: 'Teléfono', action: 'update_telefono' },
            { texto: 'Correo', action: 'update_correo' },
            { texto: 'Nuevo usuario', action: 'new_user_all' }
          ],
          timestamp: new Date(),
          messageType: 'data-update-choice'
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    }
  };

  // Modifica handleDataUpdateChoice para preguntar si desea actualizar otro campo
  const handleDataUpdateChoice = (field) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: field === 'new_user_all' ? 'Nuevo usuario' : field.replace('update_', ''),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);

    if (field === 'new_user_all') {
      // Redirigir al flujo de registro de nuevo usuario
      setUserData(initialUserData);
      setUserStep(0);
      setCurrentCase(null);
      setCaseNumber('');
      setCurrentTramite(null);
      setIsComplete(false);
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Por favor, ingresa tu número de cédula:',
          timestamp: new Date(),
          messageType: 'cedula-input'
        };
        setMessages([botMessage]);
        setChatStep('new-user-cedula');
      }, 500);
    } else {
      // Actualizar campo específico
      const fieldName = field.replace('update_', '');
      setChatStep('data-update-field');
      setUserStep(userQuestions.findIndex(q => q.key === fieldName));
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Vamos a actualizar tu ${fieldName}. ${userQuestions.find(q => q.key === fieldName)?.label}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    }
  };

  // Maneja la respuesta del usuario al actualizar un campo específico
  const handleUserInputSubmit = async (e) => {
    e.preventDefault();

    if (chatStep === 'cedula-input' || chatStep === 'new-user-cedula') {
      if (!inputValue.trim()) {
        setInputError('Por favor ingresa tu número de cédula');
        return;
      }
      if (!/^[0-9]{10}$/.test(inputValue)) {
        setInputError('La cédula debe tener exactamente 10 números');
        return;
      }
    }

    if (chatStep === 'cedula-input') {
      await handleCedulaInput(inputValue.trim());
      setInputValue('');
      setInputError('');
      return;
    }

    if (chatStep === 'new-user-cedula') {
      if (!inputValue.trim()) {
        setInputError('Por favor ingresa tu número de cédula');
        return;
      }
      if (!/^[0-9]{10}$/.test(inputValue)) {
        setInputError('La cédula debe tener exactamente 10 números');
        return;
      }
      // Verificar si la cédula ya existe en la base de datos
      const usuarioExistente = await getUsuarioByCedula(inputValue.trim());
      if (usuarioExistente) {
        setInputError('Ya existe un usuario registrado con esa cédula. Si eres tú, selecciona "Cédula Existente".');
        return;
      }
      // Agregar respuesta del usuario al chat
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content: inputValue,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setUserData({ ...initialUserData, cedula: inputValue.trim() });
      setInputValue('');
      setInputError('');
      setChatStep('data-collection');
      setUserStep(0);
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: userQuestions[0].label,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 400);
      return;
    }

    if (chatStep === 'data-update-field') {
      // Actualiza solo el campo seleccionado en la colección 'usuarios'
      let newUserData = { ...userData };
      const currentQuestion = userQuestions[userStep];
      const error = validateInput(currentQuestion.key, inputValue);
      if (error) {
        setInputError(error);
        return;
      }
      // Agregar respuesta del usuario al chat
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content: inputValue,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      // Guardar dato actualizado
      newUserData[currentQuestion.key] = inputValue;
      setUserData(newUserData);
      // Guardar en la colección usuarios
      await upsertUsuarioByCedula(newUserData);
      console.log('Usuario actualizado en colección usuarios:', newUserData);
      setInputValue('');
      setInputError('');
      // Preguntar si desea actualizar otro campo
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '¿Deseas actualizar otro dato?',
          options: [
            { texto: 'Sí', action: 'update_more' },
            { texto: 'No', action: 'finish_update' }
          ],
          timestamp: new Date(),
          messageType: 'update-more-choice'
        };
        setMessages((prev) => [...prev, botMessage]);
        setChatStep('update-more-choice');
      }, 500);
      return;
    }

    if (chatStep === 'data-collection') {
      let nextStep = userStep;
      let newUserData = { ...userData };
      const currentQuestion = userQuestions[userStep];
      const error = validateInput(currentQuestion.key, inputValue);
      if (error) {
        setInputError(error);
        return;
      }
      // Agregar respuesta del usuario al chat
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content: inputValue,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      // Guardar dato
      newUserData[currentQuestion.key] = inputValue;
      setUserData(newUserData);
      setInputValue('');
      setInputError('');
      // Siguiente pregunta o pasar a trámites
      let nextIndex = nextStep + 1;
      if (nextIndex < userQuestions.length) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: 'bot',
              content: userQuestions[nextIndex].label,
              timestamp: new Date(),
            },
          ]);
          setUserStep(nextIndex);
        }, 400);
      } else {
        // Guardar usuario en la colección 'usuarios' solo cuando todos los datos están completos
        await upsertUsuarioByCedula(newUserData);
        console.log('Usuario nuevo guardado en colección usuarios:', newUserData);
        // Crear nuevo caso y mostrar trámites
        try {
          const { caseId, caseNumber: newCaseNumber } = await createNewCase(newUserData);
          setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
          setCaseNumber(newCaseNumber);
          setChatStep('tramites');
          const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2,
                type: 'bot',
                content: `¡Hola ${getNombreSeguro(newUserData)} ${getApellidoSeguro(newUserData)}! ✅ Caso creado: ${newCaseNumber}`,
                timestamp: new Date(),
              },
              {
                id: Date.now() + 3,
                type: 'bot',
                content: 'Por favor, selecciona el trámite que deseas realizar:',
                options: tramiteOptions,
                timestamp: new Date(),
              },
            ]);
            setUserStep('tramites');
          }, 400);
        } catch (error) {
          console.error('Error al crear caso:', error);
          setChatStep('tramites');
          const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2,
                type: 'bot',
                content: `¡Hola ${getNombreSeguro(newUserData)} ${getApellidoSeguro(newUserData)}! Por favor, selecciona el trámite que deseas realizar.`,
                options: tramiteOptions,
                timestamp: new Date(),
              },
            ]);
            setUserStep('tramites');
          }, 400);
        }
      }
    }
  };

  // Maneja la opción de actualizar más campos o terminar
  const handleUpdateMoreChoice = async (choice) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: choice === 'update_more' ? 'Sí' : 'No',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);

    if (choice === 'update_more') {
      setChatStep('data-update');
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '¿Qué dato deseas actualizar?',
          options: [
            { texto: 'Teléfono', action: 'update_telefono' },
            { texto: 'Correo', action: 'update_correo' },
            { texto: 'Nuevo usuario', action: 'new_user_all' }
          ],
          timestamp: new Date(),
          messageType: 'data-update-choice'
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    } else {
      // Guardar los datos actualizados en la colección 'usuarios' antes de mostrar el toast y crear un nuevo caso
      if (userData && userData.cedula) {
        // Recargar los datos del usuario desde la colección 'usuarios' usando la cédula
        let usuarioActualizado = userData;
        const usuarioBD = await getUsuarioByCedula(userData.cedula);
        if (usuarioBD) {
          usuarioActualizado = usuarioBD;
        }
        await upsertUsuarioByCedula(usuarioActualizado);
        console.log('Usuario actualizado en colección usuarios (final):', usuarioActualizado);
        // Crear un nuevo caso con la cédula actualizada
        const { caseId, caseNumber: newCaseNumber } = await createNewCase(usuarioActualizado);
        setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
        setCaseNumber(newCaseNumber);
        setToastMessage(`Datos actualizados:\nTeléfono: ${usuarioActualizado.telefono}\nCorreo: ${usuarioActualizado.correo}`);
        setShowToast(true);
        const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${getNombreSeguro(usuarioActualizado)} ${getApellidoSeguro(usuarioActualizado)}. Caso: ${newCaseNumber}`,
            timestamp: new Date(),
          };
          const tramitesMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: '¿Qué trámite te gustaría realizar?',
            options: tramiteOptions,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage, tramitesMessage]);
          setChatStep('tramites');
          setUserStep('tramites');
        }, 1000);
      } else {
        setToastMessage('No se encontró el usuario actual para actualizar.');
        setShowToast(true);
        const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
        setTimeout(() => {
          const tramitesMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: '¿Qué trámite te gustaría realizar?',
            options: tramiteOptions,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, tramitesMessage]);
          setChatStep('tramites');
          setUserStep('tramites');
        }, 1000);
      }
    }
  };

  const handleDownloadPDF = (pdfData) => {
    // Mostrar notificación de éxito
    console.log('PDF descargado exitosamente:', pdfData);
    // Aquí podrías agregar una notificación toast
  };

  const handleContinueFromConversation = (caseData) => {
    setCurrentCase(caseData);
    setUserData(caseData.userData);
    setAppMode('chat');
    const tramiteOptions = Object.entries(tramites).map(([id, tramite]) => ({ texto: tramite.nombre, action: id }));
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: `¡Continuando con el caso: ${caseData.caseNumber}!`,
        timestamp: new Date(),
      },
      {
        id: Date.now() + 1,
        type: 'bot',
        content: '¿Qué trámite te gustaría realizar?',
        options: tramiteOptions,
        timestamp: new Date(),
      },
    ]);
    setUserStep('tramites');
    setChatStep('tramites');
  };

  const renderMessage = (message) => {
    if (message.type === 'user') {
      return (
        <div key={message.id} className="message user-message">
          <div className="message-content">{message.content}</div>
          <div className="message-time">{message.timestamp.toLocaleTimeString()}</div>
        </div>
      );
    }
    return (
      <div key={message.id} className={`message bot-message ${message.resultType ? `result-${message.resultType}` : ''} ${message.messageType ? message.messageType : ''}`}>
        <div className="message-content">
          {message.content.split('\n').map((line, i) => <div key={i}>{line}</div>)}
          {message.details && <div className="message-details">{message.details}</div>}
          {message.steps && (
            <div className="message-steps">
              <h6>Pasos a seguir:</h6>
              <ol>
                {message.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
        {/* Mostrar opciones si existen, sin depender de chatStep ni currentTramite */}
        {message.options && (
          <div className="message-options">
            {message.options.map((option, index) => (
              <Button
                key={index}
                variant="outline-primary"
                className="option-button"
                onClick={() => {
                  if (option.action) {
                    if (option.action === 'same_data' || option.action === 'new_data') {
                      handleDataChoice(option.action);
                    } else if (option.action === 'existing_cedula' || option.action === 'new_user') {
                      handleCedulaChoice(option.action);
                    } else if (option.action === 'use_existing' || option.action === 'update_data') {
                      handleUserFoundChoice(option.action);
                    } else if (option.action === 'update_telefono' || option.action === 'update_correo' || option.action === 'new_user_all') {
                      handleDataUpdateChoice(option.action);
                    } else if (option.action === 'update_more' || option.action === 'finish_update') {
                      handleUpdateMoreChoice(option.action);
                    } else if (tramites && tramites[option.action]) {
                      startConversation(option.action);
                    } else {
                      handleContinueOption(option.action);
                    }
                  } else {
                    handleOptionSelect(option);
                  }
                }}
              >
                {option.texto}
              </Button>
            ))}
          </div>
        )}
        <div className="message-time">{message.timestamp.toLocaleTimeString()}</div>
      </div>
    );
  };

  // Subida de PDF a Firebase Storage
  /*
  const handlePdfFileChange = (e) => {
    setPdfError('');
    setSelectedPdf(null);
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Solo se permiten archivos PDF.');
      return;
    }
    setSelectedPdf(file);
  };

  const handlePdfUpload = async () => {
    if (!selectedPdf) {
      setPdfError('Selecciona un archivo PDF primero.');
      return;
    }
    setPdfUploading(true);
    setPdfError('');
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `tramites_pdfs/${userData.cedula}_${Date.now()}.pdf`);
      await uploadBytes(storageRef, selectedPdf);
      const url = await getDownloadURL(storageRef);
      setPdfUrl(url);
      if (conversationId) {
        await updateConversationWithPdf(conversationId, url);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'bot',
          content: '¡Documento PDF subido correctamente!',
          timestamp: new Date(),
        },
      ]);
      setSelectedPdf(null);
    } catch (err) {
      setPdfError('Error al subir el PDF. Intenta de nuevo.');
    } finally {
      setPdfUploading(false);
    }
  };
  */

  // Renderizar pantalla de bienvenida
  const renderWelcomeScreen = () => (
    <Container fluid className="chatbot-container">
      <Row className="justify-content-center">
        <Col xs={12}>
          <Card className="chatbot-card">
            <Card.Header className="chatbot-header">
              <h4 className="mb-0">
                <i className="fas fa-robot me-2"></i>
                Asistente de Trámites Municipales
              </h4>
            </Card.Header>
            <Card.Body className="chatbot-body">
              <div className="welcome-section">
                <div className="welcome-message">
                  <h5>¡Bienvenido al Sistema de Trámites Municipales!</h5>
                  <p className="text-muted">
                    Te ayudo a gestionar tus trámites de manera fácil y eficiente.
                  </p>
                </div>
                
                <div className="welcome-options">
                  <Button
                    variant="primary"
                    size="lg"
                    className="welcome-option-btn mb-3"
                    onClick={() => handleWelcomeOption('new_case')}
                  >
                    <div className="option-icon">
                      <i className="fas fa-plus-circle"></i>
                    </div>
                    <div className="option-content">
                      <strong>Iniciar Nuevo Trámite</strong>
                      <small>Crear un nuevo caso y comenzar un trámite</small>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="welcome-option-btn mb-3"
                    onClick={() => handleWelcomeOption('search_case')}
                  >
                    <div className="option-icon">
                      <i className="fas fa-search"></i>
                    </div>
                    <div className="option-content">
                      <strong>Consultar Caso Existente</strong>
                      <small>Buscar por número de caso</small>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline-secondary"
                    size="lg"
                    className="welcome-option-btn"
                    onClick={() => handleWelcomeOption('my_cases')}
                  >
                    <div className="option-icon">
                      <i className="fas fa-folder-open"></i>
                    </div>
                    <div className="option-content">
                      <strong>Ver Mis Casos</strong>
                      <small>Buscar por número de cédula</small>
                    </div>
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );



  // Renderizar pantalla de búsqueda por cédula
  const renderCedulaSearch = () => (
    <CedulaSearch 
      onCaseSelected={handleCaseSelected}
      onBack={goBackToWelcome}
    />
  );

  // Renderizar pantalla de búsqueda de casos
  const renderCaseSearch = () => (
    <CaseSearch 
      onCaseFound={handleCaseFound}
      onBack={goBackToWelcome}
    />
  );



  // Renderizar pantalla de conversación del caso
  const renderCaseConversation = () => (
    <CaseConversation 
      caseData={selectedCaseForConversation}
      onBack={() => setAppMode('cedula-search')}
      onDownloadPDF={handleDownloadPDF}
      onContinue={handleContinueFromConversation}
    />
  );

  // Renderizar chat
  const renderChat = () => (
    <Container fluid className="chatbot-container">
      <Row className="justify-content-center">
        <Col xs={12}>
          <Card className="chatbot-card">
            <Card.Header className="chatbot-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-robot me-2"></i>
                  Asistente de Trámites Municipales
                </h4>
                {currentCase && (
                  <div className="case-info-header">
                    <small className="text-white">
                      <i className="fas fa-hashtag me-1"></i>
                      {currentCase.caseNumber}
                    </small>
                  </div>
                )}
              </div>
            </Card.Header>
            <Card.Body className="chatbot-body">
              <div className="messages-container">
                <div className="messages-list">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
                {/* Input para datos personales tipo chat con botón de enviar */}
                {(chatStep === 'cedula-input' || chatStep === 'new-user-cedula' || chatStep === 'data-collection' || chatStep === 'data-update-field') && (
                  <Form onSubmit={handleUserInputSubmit} className="chat-input-form">
                    <InputGroup>
                      <Form.Control
                        type={chatStep === 'cedula-input' || chatStep === 'new-user-cedula' ? "text" : "text"}
                        placeholder={
                          chatStep === 'cedula-input' || chatStep === 'new-user-cedula'
                            ? "Ingresa tu número de cédula..."
                            : "Escribe tu respuesta..."
                        }
                        value={inputValue}
                        onChange={e => {
                          if (chatStep === 'cedula-input' || chatStep === 'new-user-cedula') {
                            const val = e.target.value;
                            // Si contiene letras, mostrar alerta
                            if (/[^0-9]/.test(val)) {
                              setInputError('Solo se deben ingresar números, no letras');
                            } else {
                              setInputError('');
                            }
                            // Solo permitir números y máximo 10 dígitos
                            const soloNumeros = val.replace(/[^0-9]/g, '');
                            if (soloNumeros.length <= 10) setInputValue(soloNumeros);
                          } else if (chatStep === 'data-collection' || chatStep === 'data-update-field') {
                            const currentQuestion = userQuestions[userStep];
                            if (currentQuestion.key === 'nombre' || currentQuestion.key === 'apellido') {
                              // Solo letras y espacios, máximo 40 caracteres
                              const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
                              if (val.length <= 40) setInputValue(val);
                              setInputError('');
                              return;
                            }
                            if (currentQuestion.key === 'telefono') {
                              // Solo números, máximo 10 dígitos
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length <= 10) setInputValue(val);
                              setInputError('');
                              return;
                            }
                            // Para correo, permite cualquier valor, validación al enviar
                            setInputValue(e.target.value);
                            setInputError('');
                          } else {
                            setInputValue(e.target.value);
                            setInputError('');
                          }
                        }}
                        isInvalid={!!inputError}
                        autoFocus
                        autoComplete="off"
                        maxLength={chatStep === 'cedula-input' || chatStep === 'new-user-cedula' ? 10 : undefined}
                      />
                      <Button variant="primary" type="submit">
                        Enviar
                      </Button>
                    </InputGroup>
                    {inputError && (
                      <Alert variant="danger" className="mt-2 mb-0 py-2 px-3" style={{ fontSize: '0.95em', borderRadius: '12px' }}>
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {inputError}
                      </Alert>
                    )}
                  </Form>
                )}
                {/* Opciones de trámites */}
                {chatStep === 'tramites' && !currentTramite && !messages.some(m => Array.isArray(m.options) && m.options.length > 0) && (
                  <div className="tramites-grid mt-3">
                    {Object.values(tramites).map((tramite) => (
                      <Button
                        key={tramite.id}
                        variant="outline-primary"
                        className="tramite-button"
                        onClick={() => startConversation(tramite.id)}
                      >
                        <div className="tramite-icon">
                          <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="tramite-info">
                          <strong>{tramite.nombre}</strong>
                          <small>{tramite.descripcion}</small>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                {/* Flujo de preguntas del trámite */}
                {currentTramite && (
                  <>
                    {/* El flujo de preguntas ya está en los mensajes */}
                    {/* Las opciones de continuar/finalizar ahora están integradas en el flujo de mensajes */}
                  </>
                )}
              </div>
              {/* Toast de datos actualizados */}
              <ToastContainer position="top-end" className="p-3">
                <Toast show={showToast} onClose={() => setShowToast(false)} delay={3500} autohide bg="success">
                  <Toast.Header closeButton={false}>
                    <strong className="me-auto">Datos actualizados</strong>
                  </Toast.Header>
                  <Toast.Body style={{ whiteSpace: 'pre-line', color: 'white' }}>{toastMessage}</Toast.Body>
                </Toast>
              </ToastContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );

  // Funciones utilitarias para acceso seguro
  const getNombreSeguro = (userData) => (userData && userData.nombre ? userData.nombre : '');
  const getApellidoSeguro = (userData) => (userData && userData.apellido ? userData.apellido : '');

  // Renderizar según el modo de la aplicación
  switch (appMode) {
    case 'welcome':
      return renderWelcomeScreen();
    case 'cedula-search':
      return renderCedulaSearch();
    case 'case-search':
      return renderCaseSearch();
    case 'case-conversation':
      return renderCaseConversation();
    case 'chat':
      return renderChat();
    default:
      return renderWelcomeScreen();
  }
};

export default Chatbot; 