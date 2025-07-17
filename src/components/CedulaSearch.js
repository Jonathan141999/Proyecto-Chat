import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { getUserCasesByCedula } from '../services/firebaseService';
import './CedulaSearch.css';

const CedulaSearch = ({ onCaseSelected, onBack }) => {
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userCases, setUserCases] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleCedulaSubmit = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) {
      setError('Por favor ingresa tu número de cédula');
      return;
    }

    if (!/^[0-9]{10}$/.test(cedula)) {
      setError('La cédula debe tener exactamente 10 números');
      return;
    }

    setLoading(true);
    setError('');
    setUserCases([]);
    setShowResults(false);

    try {
      const cases = await getUserCasesByCedula(cedula.trim());
      setUserCases(cases);
      setShowResults(true);
      
      if (cases.length === 0) {
        setError('No se encontraron casos para esta cédula');
      }
    } catch (err) {
      setError('Error al buscar casos. Intenta de nuevo.');
      console.error('Error buscando casos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseItem) => {
    if (onCaseSelected) {
      onCaseSelected(caseItem);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="cedula-search-container">
      <Card className="cedula-search-card">
        <Card.Header className="cedula-search-header">
          <h4 className="mb-0">
            <i className="fas fa-search me-2"></i>
            Buscar Mis Casos
          </h4>
          <small className="text-white">
            Ingresa tu número de cédula para ver tu historial
          </small>
        </Card.Header>
        <Card.Body className="cedula-search-body">
          {!showResults ? (
            <div className="search-form-section">
              <div className="search-message mb-4">
                <h6>Consulta de Casos</h6>
                <p className="text-muted">
                  Ingresa tu número de cédula para ver todos tus casos y trámites realizados.
                </p>
              </div>
              
              <Form onSubmit={handleCedulaSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Cédula</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 1234567890"
                    value={cedula}
                    onChange={e => {
                      // Solo permitir números y máximo 10 dígitos
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 10) setCedula(val);
                    }}
                    disabled={loading}
                    maxLength="10"
                    required
                  />
                  <Form.Text className="text-muted">
                    Ingresa solo números, sin guiones ni espacios
                  </Form.Text>
                </Form.Group>
                
                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}
                
                <div className="search-actions">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading || !cedula.trim()}
                    className="me-2"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search me-2"></i>
                        Buscar Casos
                      </>
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={onBack}>
                    <i className="fas fa-arrow-left me-2"></i>
                    Volver
                  </Button>
                </div>
              </Form>
            </div>
          ) : (
            <div className="search-results-section">
              <div className="results-header mb-4">
                <div className="results-title">
                  <h6>Casos Encontrados</h6>
                  <Badge bg="info" className="results-count">
                    {userCases.length} caso{userCases.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-muted">
                  Cédula: {cedula} - {userCases[0]?.userData?.nombre} {userCases[0]?.userData?.apellido}
                </p>
              </div>
              
              {userCases.length === 0 ? (
                <div className="no-cases-message text-center py-5">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No se encontraron casos</h6>
                  <p className="text-muted">
                    No hay casos registrados para la cédula {cedula}
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setShowResults(false);
                      setCedula('');
                      setError('');
                    }}
                    className="mt-3"
                  >
                    <i className="fas fa-plus me-2"></i>
                    Crear Nuevo Caso
                  </Button>
                </div>
              ) : (
                <div className="cases-list">
                  {userCases.map((caseItem, index) => {
                    const statusConfig = getStatusBadge(caseItem.status);
                    return (
                      <Card key={caseItem.id} className="case-item-card mb-3">
                        <Card.Body>
                          <div className="case-header">
                            <div className="case-number">
                              <i className="fas fa-hashtag me-1"></i>
                              {caseItem.caseNumber}
                            </div>
                            <Badge bg={statusConfig.variant} className="status-badge">
                              <i className={`${statusConfig.icon} me-1`}></i>
                              {statusConfig.text}
                            </Badge>
                          </div>
                          
                          <div className="case-info">
                            <div className="info-row">
                              <strong>Fecha de creación:</strong>
                              <span>{formatDate(caseItem.createdAt)}</span>
                            </div>
                            <div className="info-row">
                              <strong>Última interacción:</strong>
                              <span>{formatDate(caseItem.lastInteraction)}</span>
                            </div>
                            <div className="info-row">
                              <strong>Trámites realizados:</strong>
                              <span>{caseItem.totalTramites || 0}</span>
                            </div>
                          </div>

                          {caseItem.tramites && caseItem.tramites.length > 0 && (
                            <div className="tramites-preview mt-3">
                              <small className="text-muted">Trámites:</small>
                              <div className="tramites-list">
                                {caseItem.tramites.map((tramite, tramiteIndex) => (
                                  <div key={tramiteIndex} className="tramite-item">
                                    <i className="fas fa-file-alt me-1"></i>
                                    {tramite.nombre}
                                    <Badge bg="success" size="sm" className="ms-2">
                                      {tramite.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="case-actions mt-3">
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleCaseSelect(caseItem)}
                              className="me-2"
                            >
                              <i className="fas fa-eye me-1"></i>
                              Ver Detalles
                            </Button>
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(caseItem.caseNumber);
                                // Aquí podrías mostrar una notificación de copiado
                              }}
                            >
                              <i className="fas fa-copy me-1"></i>
                              Copiar
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              <div className="search-results-actions mt-4">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setShowResults(false);
                    setCedula('');
                    setError('');
                    setUserCases([]);
                  }}
                  className="me-2"
                >
                  <i className="fas fa-search me-2"></i>
                  Nueva Búsqueda
                </Button>
                <Button variant="outline-primary" onClick={onBack}>
                  <i className="fas fa-arrow-left me-2"></i>
                  Volver al Inicio
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CedulaSearch; 