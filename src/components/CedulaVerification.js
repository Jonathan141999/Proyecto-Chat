import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { searchUserByCedula } from '../services/firebaseService';
import './CedulaVerification.css';

const CedulaVerification = ({ onUserFound, onNewUser, onBack }) => {
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUser, setExistingUser] = useState(null);
  const [showUserData, setShowUserData] = useState(false);

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
    setExistingUser(null);
    setShowUserData(false);

    try {
      const userCase = await searchUserByCedula(cedula.trim());
      
      if (userCase) {
        setExistingUser(userCase);
        setShowUserData(true);
      } else {
        // Usuario nuevo, proceder con datos completos
        onNewUser(cedula.trim());
      }
    } catch (err) {
      setError('Error al verificar la cédula. Intenta de nuevo.');
      console.error('Error verificando cédula:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExistingData = () => {
    if (existingUser) {
      onUserFound(existingUser);
    }
  };

  const handleUpdateData = () => {
    if (existingUser) {
      onNewUser(cedula.trim(), existingUser.userData);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="cedula-verification-container">
      <Card className="cedula-verification-card">
        <Card.Header className="cedula-verification-header">
          <h4 className="mb-0">
            <i className="fas fa-id-card me-2"></i>
            Verificación de Identidad
          </h4>
          <small className="text-white">
            Ingresa tu número de cédula para continuar
          </small>
        </Card.Header>
        <Card.Body className="cedula-verification-body">
          {!showUserData ? (
            <div className="cedula-form-section">
              <div className="cedula-message mb-4">
                <h6>Identificación Requerida</h6>
                <p className="text-muted">
                  Para iniciar un nuevo trámite, necesitamos verificar tu identidad.
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
                
                <div className="cedula-actions">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading || !cedula.trim()}
                    className="me-2"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search me-2"></i>
                        Verificar Cédula
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
            <div className="user-data-section">
              <div className="user-found-message mb-4">
                <div className="user-found-header">
                  <i className="fas fa-user-check text-success me-2"></i>
                  <h6 className="text-success mb-0">Usuario Encontrado</h6>
                </div>
                <p className="text-muted">
                  Encontramos datos registrados con esta cédula. ¿Qué deseas hacer?
                </p>
              </div>
              
              <div className="existing-user-card mb-4">
                <div className="user-info-header">
                  <div className="user-basic-info">
                    <h6>{existingUser.userData.nombre} {existingUser.userData.apellido}</h6>
                    <Badge bg="info" className="case-badge">
                      Caso: {existingUser.caseNumber}
                    </Badge>
                  </div>
                  <div className="user-status">
                    <Badge bg={existingUser.status === 'active' ? 'success' : 'secondary'}>
                      {existingUser.status === 'active' ? 'Activo' : 'Completado'}
                    </Badge>
                  </div>
                </div>
                
                <div className="user-details">
                  <div className="detail-row">
                    <strong>Cédula:</strong> {existingUser.userData.cedula}
                  </div>
                  <div className="detail-row">
                    <strong>Teléfono:</strong> {existingUser.userData.telefono}
                  </div>
                  <div className="detail-row">
                    <strong>Correo:</strong> {existingUser.userData.correo}
                  </div>
                  <div className="detail-row">
                    <strong>Última interacción:</strong> {formatDate(existingUser.lastInteraction)}
                  </div>
                  <div className="detail-row">
                    <strong>Trámites realizados:</strong> {existingUser.totalTramites || 0}
                  </div>
                </div>
              </div>
              
              <div className="user-options">
                <div className="option-buttons">
                  <Button 
                    variant="success" 
                    onClick={handleUseExistingData}
                    className="option-btn me-3"
                  >
                    <div className="option-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="option-content">
                      <strong>Usar Datos Existentes</strong>
                      <small>Continuar con los mismos datos</small>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="warning" 
                    onClick={handleUpdateData}
                    className="option-btn"
                  >
                    <div className="option-icon">
                      <i className="fas fa-edit"></i>
                    </div>
                    <div className="option-content">
                      <strong>Actualizar Datos</strong>
                      <small>Modificar información personal</small>
                    </div>
                  </Button>
                </div>
                
                <div className="back-option mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setShowUserData(false);
                      setExistingUser(null);
                      setCedula('');
                    }}
                    size="sm"
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Usar otra cédula
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CedulaVerification; 