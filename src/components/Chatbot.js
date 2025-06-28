import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { tramites, resultados } from '../data/tramites';
import { saveConversation, updateConversationWithPdf, trackTramiteSelection, trackConversationStart } from '../services/firebaseService';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Chatbot.css';

const userQuestions = [
  { key: 'nombre', label: '¿Cuál es tu nombre?' },
  { key: 'apellido', label: '¿Cuál es tu apellido?' },
  { key: 'cedula', label: '¿Cuál es tu número de cédula?' },
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
  const [userData, setUserData] = useState(initialUserData);
  const [userStep, setUserStep] = useState(0); // 0: pidiendo datos, 1: trámites
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const messagesEndRef = useRef(null);
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
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: 'bot',
          content: userQuestions[0].label,
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  // Manejar input del usuario para datos personales
  const handleUserInput = (e) => {
    setInputValue(e.target.value);
    setInputError('');
  };

  const handleUserInputSubmit = (e) => {
    e.preventDefault();
    const currentQuestion = userQuestions[userStep];
    const error = validateInput(currentQuestion.key, inputValue);
    if (error) {
      setInputError(error);
      return;
    }
    // Agregar respuesta del usuario
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    // Guardar dato
    const newUserData = { ...userData, [currentQuestion.key]: inputValue };
    setUserData(newUserData);
    setInputValue('');
    setInputError('');
    // Siguiente pregunta o pasar a trámites
    if (userStep < userQuestions.length - 1) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: userQuestions[userStep + 1].label,
            timestamp: new Date(),
          },
        ]);
        setUserStep(userStep + 1);
      }, 400);
    } else {
      // Mensaje de bienvenida y mostrar trámites
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
  };

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
    setUserStep(0);
    setUserData(initialUserData);
    setInputValue('');
    setInputError('');
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
      <div key={message.id} className={`message bot-message ${message.resultType ? `result-${message.resultType}` : ''}`}>
        <div className="message-content">
          {message.content}
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
                onClick={() => handleOptionSelect(option)}
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

  return (
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
              <div className="messages-container">
                <div className="messages-list">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
                {/* Input para datos personales tipo chat con botón de enviar */}
                {userStep !== 'tramites' && !currentTramite && (
                  <Form onSubmit={handleUserInputSubmit} className="chat-input-form">
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Escribe tu respuesta..."
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
                {userStep === 'tramites' && !currentTramite && (
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
                    {isComplete && (
                      <>
                        {/* Subida de PDF al finalizar - COMENTADO */}
                        <div className="conversation-actions">
                          {/* 
                          <Form.Group controlId="pdfUpload" className="mb-2">
                            <Form.Label><b>Sube tu documento en PDF:</b></Form.Label>
                            <Form.Control type="file" accept="application/pdf" onChange={handlePdfFileChange} disabled={pdfUploading} />
                            {selectedPdf && !pdfUrl && (
                              <Button variant="success" className="mt-2" onClick={handlePdfUpload} disabled={pdfUploading}>
                                {pdfUploading ? <Spinner animation="border" size="sm" /> : 'Subir archivo'}
                              </Button>
                            )}
                            {pdfUploading && !selectedPdf && <Spinner animation="border" size="sm" className="ms-2" />}
                            {pdfError && <div className="text-danger mt-1">{pdfError}</div>}
                            {pdfUrl && <div className="text-success mt-1">PDF subido correctamente.</div>}
                          </Form.Group>
                          */}
                          <Button variant="primary" onClick={resetConversation} className="w-100 mt-2">
                            <i className="fas fa-redo me-2"></i>
                            Iniciar nuevo trámite
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Chatbot; 