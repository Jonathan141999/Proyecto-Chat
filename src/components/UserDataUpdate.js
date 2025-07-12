import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import './UserDataUpdate.css';

const UserDataUpdate = ({ existingUserData, onDataUpdated, onBack }) => {
  const [userData, setUserData] = useState({
    nombre: existingUserData?.nombre || '',
    apellido: existingUserData?.apellido || '',
    cedula: existingUserData?.cedula || '',
    telefono: existingUserData?.telefono || '',
    correo: existingUserData?.correo || ''
  });
  
  const [selectedFields, setSelectedFields] = useState({
    nombre: false,
    apellido: false,
    telefono: false,
    correo: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFieldToggle = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateField = (field, value) => {
    if (!value.trim()) return 'Este campo es obligatorio';
    
    switch (field) {
      case 'telefono':
        if (!/^[0-9]{7,15}$/.test(value)) return 'Teléfono inválido';
        break;
      case 'correo':
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Correo inválido';
        break;
      default:
        break;
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar solo los campos seleccionados
    const newErrors = {};
    let hasErrors = false;
    
    Object.keys(selectedFields).forEach(field => {
      if (selectedFields[field]) {
        const error = validateField(field, userData[field]);
        if (error) {
          newErrors[field] = error;
          hasErrors = true;
        }
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Crear objeto con datos actualizados
      const updatedData = { ...existingUserData };
      
      Object.keys(selectedFields).forEach(field => {
        if (selectedFields[field]) {
          updatedData[field] = userData[field];
        }
      });
      
      // Simular delay de actualización
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onDataUpdated(updatedData);
    } catch (error) {
      console.error('Error actualizando datos:', error);
      setErrors({ general: 'Error al actualizar datos. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const getFieldStatus = (field) => {
    if (selectedFields[field]) {
      return errors[field] ? 'error' : 'editing';
    }
    return 'readonly';
  };

  return (
    <div className="user-data-update-container">
      <Card className="user-data-update-card">
        <Card.Header className="user-data-update-header">
          <h4 className="mb-0">
            <i className="fas fa-user-edit me-2"></i>
            Actualizar Datos Personales
          </h4>
          <small className="text-white">
            Selecciona los campos que deseas actualizar
          </small>
        </Card.Header>
        <Card.Body className="user-data-update-body">
          <div className="update-message mb-4">
            <h6>Actualización Selectiva</h6>
            <p className="text-muted">
              Marca los campos que deseas modificar y actualiza la información.
            </p>
          </div>
          
          <Form onSubmit={handleSubmit}>
            {/* Cédula (solo lectura) */}
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fas fa-id-card me-2"></i>
                Número de Cédula
              </Form.Label>
              <Form.Control
                type="text"
                value={userData.cedula}
                disabled
                className="readonly-field"
              />
              <Form.Text className="text-muted">
                La cédula no se puede modificar
              </Form.Text>
            </Form.Group>

            {/* Nombre */}
            <Form.Group className="mb-3">
              <div className="field-header">
                <Form.Label>
                  <i className="fas fa-user me-2"></i>
                  Nombre
                </Form.Label>
                <Button
                  type="button"
                  variant={selectedFields.nombre ? "success" : "outline-secondary"}
                  size="sm"
                  onClick={() => handleFieldToggle('nombre')}
                  className="toggle-btn"
                >
                  {selectedFields.nombre ? (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Editando
                    </>
                  ) : (
                    <>
                      <i className="fas fa-edit me-1"></i>
                      Editar
                    </>
                  )}
                </Button>
              </div>
              <Form.Control
                type="text"
                value={userData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                disabled={!selectedFields.nombre}
                isInvalid={!!errors.nombre}
                className={getFieldStatus('nombre') === 'editing' ? 'editing-field' : ''}
              />
              {errors.nombre && (
                <Form.Control.Feedback type="invalid">
                  {errors.nombre}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Apellido */}
            <Form.Group className="mb-3">
              <div className="field-header">
                <Form.Label>
                  <i className="fas fa-user me-2"></i>
                  Apellido
                </Form.Label>
                <Button
                  type="button"
                  variant={selectedFields.apellido ? "success" : "outline-secondary"}
                  size="sm"
                  onClick={() => handleFieldToggle('apellido')}
                  className="toggle-btn"
                >
                  {selectedFields.apellido ? (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Editando
                    </>
                  ) : (
                    <>
                      <i className="fas fa-edit me-1"></i>
                      Editar
                    </>
                  )}
                </Button>
              </div>
              <Form.Control
                type="text"
                value={userData.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
                disabled={!selectedFields.apellido}
                isInvalid={!!errors.apellido}
                className={getFieldStatus('apellido') === 'editing' ? 'editing-field' : ''}
              />
              {errors.apellido && (
                <Form.Control.Feedback type="invalid">
                  {errors.apellido}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Teléfono */}
            <Form.Group className="mb-3">
              <div className="field-header">
                <Form.Label>
                  <i className="fas fa-phone me-2"></i>
                  Teléfono
                </Form.Label>
                <Button
                  type="button"
                  variant={selectedFields.telefono ? "success" : "outline-secondary"}
                  size="sm"
                  onClick={() => handleFieldToggle('telefono')}
                  className="toggle-btn"
                >
                  {selectedFields.telefono ? (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Editando
                    </>
                  ) : (
                    <>
                      <i className="fas fa-edit me-1"></i>
                      Editar
                    </>
                  )}
                </Button>
              </div>
              <Form.Control
                type="tel"
                value={userData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                disabled={!selectedFields.telefono}
                isInvalid={!!errors.telefono}
                className={getFieldStatus('telefono') === 'editing' ? 'editing-field' : ''}
                placeholder="Ej: 0987654321"
              />
              {errors.telefono && (
                <Form.Control.Feedback type="invalid">
                  {errors.telefono}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Correo */}
            <Form.Group className="mb-4">
              <div className="field-header">
                <Form.Label>
                  <i className="fas fa-envelope me-2"></i>
                  Correo Electrónico
                </Form.Label>
                <Button
                  type="button"
                  variant={selectedFields.correo ? "success" : "outline-secondary"}
                  size="sm"
                  onClick={() => handleFieldToggle('correo')}
                  className="toggle-btn"
                >
                  {selectedFields.correo ? (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Editando
                    </>
                  ) : (
                    <>
                      <i className="fas fa-edit me-1"></i>
                      Editar
                    </>
                  )}
                </Button>
              </div>
              <Form.Control
                type="email"
                value={userData.correo}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                disabled={!selectedFields.correo}
                isInvalid={!!errors.correo}
                className={getFieldStatus('correo') === 'editing' ? 'editing-field' : ''}
                placeholder="ejemplo@email.com"
              />
              {errors.correo && (
                <Form.Control.Feedback type="invalid">
                  {errors.correo}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {errors.general && (
              <Alert variant="danger" className="mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {errors.general}
              </Alert>
            )}

            <div className="update-actions">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading || !Object.values(selectedFields).some(Boolean)}
                className="me-2"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Actualizar Datos
                  </>
                )}
              </Button>
              <Button variant="outline-secondary" onClick={onBack}>
                <i className="fas fa-arrow-left me-2"></i>
                Cancelar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserDataUpdate; 