import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { tramites, resultados } from '../data/tramites';
import { saveConversation, trackTramiteSelection, trackConversationStart } from '../services/firebaseService';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [currentTramite, setCurrentTramite] = useState(null);
  const [conversationPath, setConversationPath] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = (tramiteId) => {
    const tramite = tramites[tramiteId];
    const firstQuestion = tramite.preguntas[0];
    
    setCurrentTramite(tramite);
    setConversationPath([{ tramite: tramiteId, question: 1 }]);
    
    // Track analytics
    trackTramiteSelection(tramiteId, tramite.nombre);
    trackConversationStart(tramiteId);
    
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: `¡Hola! Te ayudo con el trámite de "${tramite.nombre}". ${tramite.descripcion}`,
      timestamp: new Date()
    };
    
    const questionMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: firstQuestion.pregunta,
      options: firstQuestion.opciones,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage, questionMessage]);
  };

  const handleOptionSelect = async (option) => {
    // Agregar la respuesta del usuario
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: option.texto,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setConversationPath(prev => [...prev, { answer: option.texto }]);

    // Verificar si es un resultado final
    if (typeof option.siguiente === 'string') {
      const resultado = resultados[option.siguiente];
      
      const resultMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: resultado.titulo,
        details: resultado.mensaje,
        steps: resultado.pasos,
        resultType: resultado.tipo,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, resultMessage]);
      setIsComplete(true);
      
      // Guardar conversación en Firebase
      try {
        await saveConversation({
          tramite: currentTramite.id,
          conversationPath: [...conversationPath, { answer: option.texto }],
          result: option.siguiente,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error al guardar la conversación:', error);
        // No mostrar error al usuario, solo log
      }
      
      return;
    }

    // Buscar la siguiente pregunta
    const nextQuestion = currentTramite.preguntas.find(q => q.id === option.siguiente);
    
    if (nextQuestion) {
      setConversationPath(prev => [...prev, { question: nextQuestion.id }]);
      
      const questionMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: nextQuestion.pregunta,
        options: nextQuestion.opciones,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, questionMessage]);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentTramite(null);
    setConversationPath([]);
    setIsComplete(false);
  };

  const renderMessage = (message) => {
    if (message.type === 'user') {
      return (
        <div key={message.id} className="message user-message">
          <div className="message-content">
            {message.content}
          </div>
          <div className="message-time">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`message bot-message ${message.resultType ? `result-${message.resultType}` : ''}`}>
        <div className="message-content">
          {message.content}
          {message.details && (
            <div className="message-details">
              {message.details}
            </div>
          )}
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
        <div className="message-time">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  };

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
              {messages.length === 0 ? (
                <div className="welcome-section">
                  <div className="welcome-message">
                    <i className="fas fa-city fa-3x mb-3 text-primary"></i>
                    <h5>¿En qué trámite municipal te puedo ayudar?</h5>
                    <p className="text-muted">Selecciona el trámite que necesitas realizar:</p>
                  </div>
                  
                  <div className="tramites-grid">
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
                </div>
              ) : (
                <div className="messages-container">
                  <div className="messages-list">
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {isComplete && (
                    <div className="conversation-actions">
                      <Button
                        variant="primary"
                        onClick={resetConversation}
                        className="w-100"
                      >
                        <i className="fas fa-redo me-2"></i>
                        Iniciar nuevo trámite
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Chatbot; 