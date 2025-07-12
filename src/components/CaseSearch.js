import React, { useState } from 'react';
import { Card, Form, InputGroup, Button, Alert, Spinner } from 'react-bootstrap';
import { searchCaseByNumber } from '../services/firebaseService';
import './CaseSearch.css';

const CaseSearch = ({ onCaseFound, onBack }) => {
  const [caseNumber, setCaseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [caseData, setCaseData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!caseNumber.trim()) {
      setError('Por favor ingresa un número de caso');
      return;
    }

    setLoading(true);
    setError('');
    setCaseData(null);

    try {
      const foundCase = await searchCaseByNumber(caseNumber.trim());
      
      if (foundCase) {
        setCaseData(foundCase);
        if (onCaseFound) {
          onCaseFound(foundCase);
        }
      } else {
        setError('No se encontró ningún caso con ese número. Verifica el número e intenta de nuevo.');
      }
    } catch (err) {
      setError('Error al buscar el caso. Intenta de nuevo.');
      console.error('Error searching case:', err);
    } finally {
      setLoading(false);
    }
  };

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
      active: { variant: 'success', text: 'Activo' },
      completed: { variant: 'primary', text: 'Completado' },
      pending: { variant: 'warning', text: 'Pendiente' },
      closed: { variant: 'secondary', text: 'Cerrado' }
    };
    
    const config = statusConfig[status] || { variant: 'info', text: status };
    return { variant: config.variant, text: config.text };
  };

  return (
    <div className="case-search-container">
      <Card className="case-search-card">
        <Card.Header className="case-search-header">
          <h5 className="mb-0">
            <i className="fas fa-search me-2"></i>
            Consultar Caso
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Número de Caso</strong>
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Ej: CAS-2024-1703123456789-123"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  disabled={loading}
                  className="case-number-input"
                />
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading || !caseNumber.trim()}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search me-2"></i>
                      Buscar
                    </>
                  )}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Ingresa el número de caso que recibiste al crear tu trámite
              </Form.Text>
            </Form.Group>
          </Form>

          {error && (
            <Alert variant="danger" className="mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {caseData && (
            <div className="case-details mt-4">
              <h6 className="mb-3">
                <i className="fas fa-file-alt me-2"></i>
                Detalles del Caso
              </h6>
              
              <div className="case-info-grid">
                <div className="case-info-item">
                  <strong>Número de Caso:</strong>
                  <span className="case-number">{caseData.caseNumber}</span>
                </div>
                
                <div className="case-info-item">
                  <strong>Estado:</strong>
                  <span className={`badge bg-${getStatusBadge(caseData.status).variant}`}>
                    {getStatusBadge(caseData.status).text}
                  </span>
                </div>
                
                <div className="case-info-item">
                  <strong>Usuario:</strong>
                  <span>{caseData.userData?.nombre} {caseData.userData?.apellido}</span>
                </div>
                
                <div className="case-info-item">
                  <strong>Cédula:</strong>
                  <span>{caseData.userData?.cedula}</span>
                </div>
                
                <div className="case-info-item">
                  <strong>Trámites Realizados:</strong>
                  <span>{caseData.totalTramites || 0}</span>
                </div>
                
                <div className="case-info-item">
                  <strong>Última Interacción:</strong>
                  <span>{formatDate(caseData.lastInteraction)}</span>
                </div>
              </div>

              {caseData.tramites && caseData.tramites.length > 0 && (
                <div className="tramites-list mt-3">
                  <h6>Trámites en este caso:</h6>
                  <div className="tramites-grid">
                    {caseData.tramites.map((tramite, index) => (
                      <div key={index} className="tramite-item">
                        <div className="tramite-icon">
                          <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="tramite-info">
                          <strong>{tramite.nombre}</strong>
                          <small>Estado: {tramite.status || 'Completado'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="case-actions mt-4">
                <Button 
                  variant="primary" 
                  onClick={() => onCaseFound(caseData)}
                  className="me-2"
                >
                  <i className="fas fa-play me-2"></i>
                  Continuar con este caso
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setCaseData(null);
                    setCaseNumber('');
                    setError('');
                  }}
                >
                  <i className="fas fa-search me-2"></i>
                  Buscar otro caso
                </Button>
              </div>
            </div>
          )}

          <div className="case-search-actions mt-3">
            <Button variant="outline-primary" onClick={onBack}>
              <i className="fas fa-arrow-left me-2"></i>
              Volver al inicio
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CaseSearch; 