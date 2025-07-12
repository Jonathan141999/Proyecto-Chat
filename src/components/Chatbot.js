import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
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
  closeCase
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
  
  // const [pdfUploading, setPdfUploading] = useState(false);
  // const [pdfUrl, setPdfUrl] = useState(null);
  // const [pdfError, setPdfError] = useState('');
  // const [conversationId, setConversationId] = useState(null);
  // const [selectedPdf, setSelectedPdf] = useState(null);

  // Validación básica para cada campo
  const validateInput = (key, value) => {
    if (!value.trim()) return 'Este campo es obligatorio';
    if (key === 'cedula' && !/^[0-9]+$/.test(value)) return 'Cédula inválida';
    if (key === 'telefono' && !/^[0-9]{7,15}$/.test(value)) return 'Teléfono inválido';
    if (key === 'correo' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Correo inválido';
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
    setConversationPath([{ tramite: tramiteId, question: 1 }]);
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
      setConversationPath((prev) => [...prev, { question: nextQuestion.id }]);
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
      // Preguntar si usar los mismos datos del usuario
      const continueMessage = {
        id: Date.now(),
        type: 'user',
        content: 'Realizar otro trámite',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, continueMessage]);
      
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '¿Te gustaría usar los mismos datos personales o ingresar nuevos datos?',
          options: [
            { texto: 'Usar mismos datos', action: 'same_data' },
            { texto: 'Ingresar nuevos datos', action: 'new_data' }
          ],
          timestamp: new Date(),
          messageType: 'data-choice'
        };
        setMessages((prev) => [...prev, botMessage]);
        setShowContinueOptions(false);
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
      
      setTimeout(() => {
        const goodbyeMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `¡Gracias por usar nuestro asistente, ${userData.nombre}! Ha sido un placer ayudarte. Si necesitas más información, no dudes en volver. ¡Que tengas un excelente día! 👋`,
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
        const { caseId, caseNumber: newCaseNumber } = await createNewCaseWithExistingUser(userData, currentCase?.caseNumber);
        setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
        setUserData(existingUserData); // Asegúrate de que existingUserData esté actualizado
        setChatStep('tramites');
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Nuevo caso creado: ${newCaseNumber} con tus datos existentes. Selecciona el trámite que deseas realizar:`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setCurrentTramite(null);
          setIsComplete(false);
          setUserStep('tramites');
        }, 500);
      } catch (error) {
        console.error('Error al crear nuevo caso:', error);
        // Continuar sin caso si hay error
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
    } else {
      // Resetear datos y comenzar nuevo caso
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
          content: userQuestions[0].label,
          timestamp: new Date(),
        };
        setMessages([botMessage]);
      }, 500);
    }
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

  const handleCaseSelected = (caseData) => {
    setSelectedCaseForConversation(caseData);
    setAppMode('case-conversation');
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
      // Buscar usuario existente
      try {
        const existingCase = await searchUserByCedula(cedula);
        if (existingCase) {
          setExistingUserData(existingCase.userData);
          setChatStep('user-found');
          setTimeout(() => {
            const botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: `¡Usuario encontrado!\n\nNombre: ${existingCase.userData.nombre}\nApellido: ${existingCase.userData.apellido}\nTeléfono: ${existingCase.userData.telefono}\nCorreo: ${existingCase.userData.correo}`,
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
        // Mostrar mensaje de error real y no continuar el flujo
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
        const { caseId, caseNumber: newCaseNumber } = await createNewCaseWithExistingUser(existingUserData);
        setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
        setUserData(existingUserData);
        setChatStep('tramites');
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${existingUserData.nombre} ${existingUserData.apellido}. Nuevo caso creado: ${newCaseNumber}`,
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
        }, 500);
      } catch (error) {
        console.error('Error al crear caso:', error);
        setUserData(existingUserData);
        setChatStep('tramites');
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `¡Perfecto! Bienvenido ${existingUserData.nombre} ${existingUserData.apellido}. ¿Qué trámite te gustaría realizar?`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 500);
      }
    } else {
      // Actualizar datos
      setChatStep('data-update');
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Vamos a actualizar tus datos. ¿Qué información te gustaría cambiar?',
          options: [
            { texto: 'Nombre', action: 'update_nombre' },
            { texto: 'Apellido', action: 'update_apellido' },
            { texto: 'Teléfono', action: 'update_telefono' },
            { texto: 'Correo', action: 'update_correo' },
            { texto: 'Todo', action: 'update_all' }
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
      content: field === 'update_all' ? 'Todo' : field.replace('update_', ''),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);

    if (field === 'update_all') {
      setChatStep('data-collection');
      setUserStep(0);
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Perfecto, vamos a actualizar todos tus datos. Empecemos:',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setTimeout(() => {
          const questionMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: userQuestions[0].label,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, questionMessage]);
        }, 1000);
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

    if (chatStep === 'cedula-input') {
      await handleCedulaInput(inputValue.trim());
      setInputValue('');
      setInputError('');
      return;
    }

    if (chatStep === 'new-user-cedula') {
      // Validar cédula
      if (!inputValue.trim()) {
        setInputError('Por favor ingresa tu número de cédula');
        return;
      }
      if (!/^[0-9]+$/.test(inputValue)) {
        setInputError('La cédula debe contener solo números');
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
      // Guardar la cédula en el estado de usuario
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
      // Actualiza solo el campo seleccionado
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
        // Crear nuevo caso y mostrar trámites
        try {
          const { caseId, caseNumber: newCaseNumber } = await createNewCase(newUserData);
          setCurrentCase({ id: caseId, caseNumber: newCaseNumber });
          setCaseNumber(newCaseNumber);
          setChatStep('tramites');
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2,
                type: 'bot',
                content: `¡Hola ${newUserData.nombre} ${newUserData.apellido}! ✅ Caso creado: ${newCaseNumber}`,
                timestamp: new Date(),
              },
              {
                id: Date.now() + 3,
                type: 'bot',
                content: 'Por favor, selecciona el trámite que deseas realizar:',
                timestamp: new Date(),
              },
            ]);
            setUserStep('tramites');
          }, 400);
        } catch (error) {
          console.error('Error al crear caso:', error);
          setChatStep('tramites');
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2,
                type: 'bot',
                content: `¡Hola ${newUserData.nombre} ${newUserData.apellido}! Por favor, selecciona el trámite que deseas realizar.`,
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
  const handleUpdateMoreChoice = (choice) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: choice === 'update_more' ? 'Sí' : 'No',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, choiceMessage]);

    if (choice === 'update_more') {
      // Vuelve a mostrar las opciones de campos a actualizar
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '¿Qué dato deseas actualizar?',
          options: [
            { texto: 'Nombre', action: 'update_nombre' },
            { texto: 'Apellido', action: 'update_apellido' },
            { texto: 'Teléfono', action: 'update_telefono' },
            { texto: 'Correo', action: 'update_correo' },
            { texto: 'Todo', action: 'update_all' }
          ],
          timestamp: new Date(),
          messageType: 'data-update-choice'
        };
        setMessages((prev) => [...prev, botMessage]);
        setChatStep('data-update');
      }, 500);
    } else {
      // Termina la actualización y muestra resumen, luego pasa al chat
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Datos actualizados:\n\nNombre: ${userData.nombre}\nApellido: ${userData.apellido}\nTeléfono: ${userData.telefono}\nCorreo: ${userData.correo}`,
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
          setChatStep('tramites');
          setUserStep('tramites');
        }, 1000);
      }, 500);
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
        timestamp: new Date(),
      },
    ]);
    setUserStep('tramites');
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
                    } else if (option.action.startsWith('update_')) {
                      handleDataUpdateChoice(option.action);
                    } else if (option.action === 'update_more' || option.action === 'finish_update') {
                      handleUpdateMoreChoice(option.action);
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
        <Col md={8} lg={6}>
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
      onBack={goBackToWelcome}
      onDownloadPDF={handleDownloadPDF}
      onContinue={handleContinueFromConversation}
    />
  );

  // Renderizar chat
  const renderChat = () => (
    <Container fluid className="chatbot-container">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
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
                {(chatStep === 'cedula-input' || chatStep === 'new-user-cedula' || chatStep === 'data-collection') && (
                  <Form onSubmit={handleUserInputSubmit} className="chat-input-form">
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder={
                          chatStep === 'cedula-input' || chatStep === 'new-user-cedula'
                            ? "Ingresa tu número de cédula..."
                            : "Escribe tu respuesta..."
                        }
                        value={inputValue}
                        onChange={handleUserInput}
                        isInvalid={!!inputError}
                        autoFocus
                        autoComplete="off"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            // Permitir enviar con Enter
                          }
                        }}
                      />
                      <Button variant="primary" type="submit">
                        Enviar
                      </Button>
                      <Form.Control.Feedback type="invalid">{inputError}</Form.Control.Feedback>
                    </InputGroup>
                  </Form>
                )}
                {/* Opciones de trámites */}
                {chatStep === 'tramites' && !currentTramite && (
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );

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