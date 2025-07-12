import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { getUserCases } from '../services/firebaseService';
import './MyCases.css';

const MyCases = ({ userData, onCaseSelected, onBack }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadUserCases();
  }, []);

  const loadUserCases = async () => {
    if (!userData?.cedula) {
      setError('No se encontró información del usuario');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userCases = await getUserCases(userData.cedula);
      setCases(userCases);
    } catch (err) {
      setError('Error al cargar tus casos. Intenta de nuevo.');
      console.error('Error loading user cases:', err);
    } finally {
      setLoading(false);
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

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.userData?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCaseSelect = (caseItem) => {
    if (onCaseSelected) {
      onCaseSelected(caseItem);
    }
  };

  if (loading) {
    return (
      <div className="my-cases-container">
        <Card className="my-cases-card">
          <Card.Body className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando tus casos...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-cases-container">
      <Card className="my-cases-card">
        <Card.Header className="my-cases-header">
          <h5 className="mb-0">
            <i className="fas fa-folder-open me-2"></i>
            Mis Casos
          </h5>
          <small className="text-muted">
            {userData?.nombre} {userData?.apellido} - {userData?.cedula}
          </small>
        </Card.Header>
        <Card.Body>
          {/* Filtros y búsqueda */}
          <div className="filters-section mb-4">
            <div className="row">
              <div className="col-md-6 mb-2">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por número de caso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="completed">Completados</option>
                  <option value="pending">Pendientes</option>
                  <option value="closed">Cerrados</option>
                </Form.Select>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {filteredCases.length === 0 ? (
            <div className="no-cases-message text-center py-5">
              <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
              <h6 className="text-muted">
                {cases.length === 0 
                  ? 'No tienes casos registrados aún. ¡Crea tu primer caso!'
                  : 'No se encontraron casos con los filtros aplicados.'
                }
              </h6>
              {cases.length === 0 && (
                <Button variant="primary" onClick={onBack} className="mt-3">
                  <i className="fas fa-plus me-2"></i>
                  Crear mi primer caso
                </Button>
              )}
            </div>
          ) : (
            <div className="cases-grid">
              {filteredCases.map((caseItem) => {
                const statusConfig = getStatusBadge(caseItem.status);
                return (
                  <Card key={caseItem.id} className="case-card">
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
                        <div className="info-item">
                          <i className="fas fa-user me-2"></i>
                          <span>{caseItem.userData?.nombre} {caseItem.userData?.apellido}</span>
                        </div>
                        
                        <div className="info-item">
                          <i className="fas fa-file-alt me-2"></i>
                          <span>{caseItem.totalTramites || 0} trámites</span>
                        </div>
                        
                        <div className="info-item">
                          <i className="fas fa-calendar me-2"></i>
                          <span>{formatDate(caseItem.lastInteraction)}</span>
                        </div>
                      </div>

                      {caseItem.tramites && caseItem.tramites.length > 0 && (
                        <div className="tramites-preview mt-3">
                          <small className="text-muted">Últimos trámites:</small>
                          <div className="tramites-list">
                            {caseItem.tramites.slice(-2).map((tramite, index) => (
                              <div key={index} className="tramite-preview-item">
                                <i className="fas fa-file-alt me-1"></i>
                                {tramite.nombre}
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
                          <i className="fas fa-play me-1"></i>
                          Continuar
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

          <div className="my-cases-actions mt-4">
            <Button variant="outline-primary" onClick={onBack}>
              <i className="fas fa-arrow-left me-2"></i>
              Volver al inicio
            </Button>
            <Button variant="outline-secondary" onClick={loadUserCases} className="ms-2">
              <i className="fas fa-sync-alt me-2"></i>
              Actualizar
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MyCases; 