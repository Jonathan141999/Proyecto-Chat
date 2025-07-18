import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getUsuarioByCedula } from '../services/firebaseService';
import './CaseConversation.css';

const CaseConversation = ({ caseData, onBack, onDownloadPDF, onContinue }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [usuarioCompleto, setUsuarioCompleto] = useState(caseData.userData);
  const cardBodyRef = useRef();

  useEffect(() => {
    const fetchUsuario = async () => {
      if (
        (!caseData.userData?.nombre || !caseData.userData?.telefono || !caseData.userData?.correo) &&
        caseData.userData?.cedula
      ) {
        const datos = await getUsuarioByCedula(caseData.userData.cedula);
        if (datos) setUsuarioCompleto({ ...caseData.userData, ...datos });
      }
    };
    fetchUsuario();
  }, [caseData]);

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
    try {
      setLoading(true);
      
      // Crear un nuevo PDF
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      
      // Función para agregar texto con salto de línea automático
      const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        if (isBold) pdf.setFont(undefined, 'bold');
        else pdf.setFont(undefined, 'normal');
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        if (yPosition + (lines.length * fontSize * 0.4) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.4 + 5;
      };
      
      // Título principal
      addText('REPORTE DE CASO MUNICIPAL', 18, true, [102, 126, 234]);
      addText('', 12);
      
      // Información del caso
      addText('INFORMACIÓN DEL CASO', 14, true, [102, 126, 234]);
      addText(`Número de Caso: ${caseData.caseNumber}`, 12, true);
      addText(`Usuario: ${usuarioCompleto?.nombre} ${usuarioCompleto?.apellido}`, 12);
      addText(`Cédula: ${usuarioCompleto?.cedula}`, 12);
      addText(`Teléfono: ${usuarioCompleto?.telefono}`, 12);
      addText(`Correo: ${usuarioCompleto?.correo}`, 12);
      addText(`Fecha de Creación: ${formatDate(caseData.createdAt)}`, 12);
      addText(`Última Interacción: ${formatDate(caseData.lastInteraction)}`, 12);
      addText(`Estado: ${getStatusBadge(caseData.status).text}`, 12);
      addText(`Total de Trámites: ${caseData.totalTramites || 0}`, 12);
      addText('', 12);
      
      // Trámites realizados
      if (caseData.tramites && caseData.tramites.length > 0) {
        addText('TRÁMITES REALIZADOS', 14, true, [102, 126, 234]);
        caseData.tramites.forEach((tramite, index) => {
          addText(`Trámite #${index + 1}: ${tramite.nombre}`, 12, true);
          addText(`Resultado: ${tramite.result}`, 12);
          addText(`Completado: ${formatDate(tramite.completedAt)}`, 12);
          addText('', 12);
        });
      }
      
      // Conversaciones detalladas
      if (caseData.conversations && caseData.conversations.length > 0) {
        addText('HISTORIAL DE CONVERSACIONES', 14, true, [102, 126, 234]);
        
        caseData.conversations.forEach((conversation, convIndex) => {
          addText(`Conversación #${convIndex + 1}`, 12, true, [40, 167, 69]);
          addText(`Trámite: ${conversation.tramite}`, 12);
          addText(`Resultado: ${conversation.result}`, 12);
          addText(`Fecha: ${formatDate(conversation.timestamp)}`, 12);
          
          // Flujo de la conversación
          if (conversation.conversationPath && conversation.conversationPath.length > 0) {
            addText('Flujo de la Conversación:', 12, true);
            conversation.conversationPath.forEach((step, stepIndex) => {
              if (step.tramite) {
                addText(`  ${stepIndex + 1}. Trámite iniciado: ${step.tramite}`, 11);
              }
              if (step.questionText) {
                addText(`  ${stepIndex + 1}. Pregunta: ${step.questionText}`, 11);
              }
              if (step.answer) {
                addText(`  ${stepIndex + 1}. Respuesta: ${step.answer}`, 11);
              }
            });
          }
          addText('', 12);
        });
      }
      
      // Pie de página
      const currentPage = pdf.getCurrentPageInfo().pageNumber;
      const totalPages = pdf.getNumberOfPages();
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Página ${currentPage} de ${totalPages}`, pageWidth - margin, pageHeight - 10);
      pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 10);
      
      // Guardar el PDF
      pdf.save(`Caso-${caseData.caseNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      if (onDownloadPDF) onDownloadPDF();
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
        <Card.Body ref={cardBodyRef}>
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
                <span>{usuarioCompleto?.nombre} {usuarioCompleto?.apellido}</span>
              </div>
              <div className="info-item">
                <strong>Cédula:</strong>
                <span>{usuarioCompleto?.cedula}</span>
              </div>
              <div className="info-item">
                <strong>Teléfono:</strong>
                <span>{usuarioCompleto?.telefono}</span>
              </div>
              <div className="info-item">
                <strong>Correo:</strong>
                <span>{usuarioCompleto?.correo}</span>
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

          {/* Botones de acción */}
          <div className="case-actions mt-4">
            <Button 
              variant="primary" 
              onClick={handleDownloadPDF} 
              className="me-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <i className="fas fa-file-download me-2"></i>
                  Descargar PDF
                </>
              )}
            </Button>
            {caseData.status === 'active' && (
              <Button variant="success" onClick={() => onContinue(caseData)} className="me-2">
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
                          {step.question && step.questionText && <span>{step.questionText}</span>}
                          {step.question && !step.questionText && <span>Pregunta #{step.question}</span>}
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