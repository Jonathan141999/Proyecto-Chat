import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { generateCasePDF } from '../services/firebaseService';
import './CaseConversation.css';

const CaseConversation = ({ caseData, onBack, onDownloadPDF, onContinue }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', text: 'Activo', icon: 'fas fa-play' },
      completed: { variant: 'primary', text: 'Completado', icon: 'fas fa-check' },
      pending: { variant: 'warning', text: 'Pendiente', icon: 'fas fa-clock' },
      closed: { variant: 'secondary', text: 'Cerrado', icon: 'fas fa-times' }
    };
    
    const config = statusConfig[status] || { variant: 'info', text: status, icon: 'fas fa-info' };
    return config;
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const pdfData = await generateCasePDF(caseData);
      
      // Crear contenido del PDF
      const pdfContent = `
        CASO: ${pdfData.caseNumber}
        Usuario: ${pdfData.userData.nombre} ${pdfData.userData.apellido}
        Cédula: ${pdfData.userData.cedula}
        Fecha: ${formatDate(pdfData.createdAt)}
        Estado: ${pdfData.status}
        
        TRÁMITES REALIZADOS:
        ${pdfData.tramites.map((tramite, index) => `
          ${index + 1}. ${tramite.nombre}
          - Estado: ${tramite.status}
          - Resultado: ${tramite.result}
          - Fecha: ${formatDate(tramite.completedAt)}
        `).join('\n')}
        
        CONVERSACIONES:
        ${pdfData.conversations.map((conv, index) => `
          Conversación ${index + 1}:
          - Trámite: ${conv.tramite}
          - Resultado: ${conv.result}
          - Fecha: ${formatDate(conv.timestamp)}
        `).join('\n')}
      `;
      
      // Crear y descargar archivo
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Caso_${pdfData.caseNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (onDownloadPDF) {
        onDownloadPDF(pdfData);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const showConversationDetails = (conversation) => {
    setSelectedConversation(conversation);
    setShowModal(true);
  };

  return (
    <div className="case-conversation-container">
      <Card className="case-conversation-card">
        <Card.Header className="case-conversation-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">
                <i className="fas fa-comments me-2"></i>
                Conversación del Caso
              </h5>
              <small className="text-white">
                {caseData.caseNumber} - {caseData.userData?.nombre} {caseData.userData?.apellido}
              </small>
            </div>
            <Badge bg={getStatusBadge(caseData.status).variant} className="status-badge">
              <i className={`${getStatusBadge(caseData.status).icon} me-1`}></i>
              {getStatusBadge(caseData.status).text}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Información del caso */}
          <div className="case-info-section mb-4">
            <h6>Información del Caso</h6>
            <div className="case-info-grid">
              <div className="info-item">
                <strong>Número de Caso:</strong>
                <span className="case-number">{caseData.caseNumber}</span>
              </div>
              <div className="info-item">
                <strong>Usuario:</strong>
                <span>{caseData.userData?.nombre} {caseData.userData?.apellido}</span>
              </div>
              <div className="info-item">
                <strong>Cédula:</strong>
                <span>{caseData.userData?.cedula}</span>
              </div>
              <div className="info-item">
                <strong>Teléfono:</strong>
                <span>{caseData.userData?.telefono}</span>
              </div>
              <div className="info-item">
                <strong>Correo:</strong>
                <span>{caseData.userData?.correo}</span>
              </div>
              <div className="info-item">
                <strong>Fecha de Creación:</strong>
                <span>{formatDate(caseData.createdAt)}</span>
              </div>
              <div className="info-item">
                <strong>Última Interacción:</strong>
                <span>{formatDate(caseData.lastInteraction)}</span>
              </div>
              <div className="info-item">
                <strong>Total de Trámites:</strong>
                <span>{caseData.totalTramites || 0}</span>
              </div>
            </div>
          </div>

          {/* Trámites realizados */}
          {caseData.tramites && caseData.tramites.length > 0 && (
            <div className="tramites-section mb-4">
              <h6>Trámites Realizados</h6>
              <div className="tramites-list">
                {caseData.tramites.map((tramite, index) => (
                  <div key={index} className="tramite-item">
                    <div className="tramite-header">
                      <div className="tramite-number">#{index + 1}</div>
                      <div className="tramite-info">
                        <strong>{tramite.nombre}</strong>
                        <small>Completado: {formatDate(tramite.completedAt)}</small>
                      </div>
                      <Badge bg="success" className="status-badge">
                        <i className="fas fa-check me-1"></i>
                        Completado
                      </Badge>
                    </div>
                    <div className="tramite-result">
                      <strong>Resultado:</strong> {tramite.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversaciones */}
          {caseData.conversations && caseData.conversations.length > 0 && (
            <div className="conversations-section mb-4">
              <h6>Historial de Conversaciones</h6>
              <div className="conversations-list">
                {caseData.conversations.map((conversation, index) => (
                  <div key={index} className="conversation-item">
                    <div className="conversation-header">
                      <div className="conversation-number">Conversación #{index + 1}</div>
                      <div className="conversation-date">
                        {formatDate(conversation.timestamp)}
                      </div>
                    </div>
                    <div className="conversation-details">
                      <div className="detail-item">
                        <strong>Trámite:</strong> {conversation.tramite}
                      </div>
                      <div className="detail-item">
                        <strong>Resultado:</strong> {conversation.result}
                      </div>
                      <div className="detail-item">
                        <strong>Pasos:</strong> {conversation.conversationPath?.length || 0} interacciones
                      </div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => showConversationDetails(conversation)}
                    >
                      <i className="fas fa-eye me-1"></i>
                      Ver Detalles
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="case-actions">
            <Button 
              variant="primary" 
              onClick={handleDownloadPDF}
              disabled={loading}
              className="me-2"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generando...
                </>
              ) : (
                <>
                  <i className="fas fa-download me-2"></i>
                  Descargar PDF
                </>
              )}
            </Button>
            {onContinue && (
              <Button 
                variant="success" 
                onClick={() => onContinue(caseData)}
                className="me-2"
              >
                <i className="fas fa-play me-2"></i>
                Continuar Caso
              </Button>
            )}
            <Button variant="outline-secondary" onClick={onBack}>
              <i className="fas fa-arrow-left me-2"></i>
              Volver
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Modal para detalles de conversación */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Conversación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedConversation && (
            <div className="conversation-details-modal">
              <div className="detail-row">
                <strong>Trámite:</strong> {selectedConversation.tramite}
              </div>
              <div className="detail-row">
                <strong>Resultado:</strong> {selectedConversation.result}
              </div>
              <div className="detail-row">
                <strong>Fecha:</strong> {formatDate(selectedConversation.timestamp)}
              </div>
              <div className="detail-row">
                <strong>Usuario:</strong> {selectedConversation.user?.nombre} {selectedConversation.user?.apellido}
              </div>
              
              {selectedConversation.conversationPath && (
                <div className="conversation-path">
                  <h6>Flujo de la Conversación:</h6>
                  <div className="path-steps">
                    {selectedConversation.conversationPath.map((step, index) => (
                      <div key={index} className="path-step">
                        <div className="step-number">{index + 1}</div>
                        <div className="step-content">
                          {step.tramite && <strong>Trámite iniciado: {step.tramite}</strong>}
                          {step.question && <span>Pregunta #{step.question}</span>}
                          {step.answer && <span>Respuesta: {step.answer}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CaseConversation; 