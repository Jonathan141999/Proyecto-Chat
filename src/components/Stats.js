import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { getConversationStats } from '../services/firebaseService';
import { tramites } from '../data/tramites';
import './Stats.css';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getConversationStats();
      setStats(data);
    } catch (err) {
      setError('Error al cargar las estadísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="stats-container">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="stats-card">
              <Card.Body className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando estadísticas...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="stats-container">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="stats-card">
              <Card.Body className="text-center text-danger">
                <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={loadStats}>
                  Reintentar
                </button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="stats-container">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="stats-card">
            <Card.Header className="stats-header">
              <h4 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas del Chatbot
              </h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="fas fa-comments"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats?.totalConversations || 0}</h3>
                      <p>Conversaciones Totales</p>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{Object.keys(tramites).length}</h3>
                      <p>Trámites Disponibles</p>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-content">
                      <h3>24/7</h3>
                      <p>Disponibilidad</p>
                    </div>
                  </div>
                </Col>
              </Row>

              <hr />

              <h5 className="mb-3">Trámites Más Consultados</h5>
              <Row>
                {Object.entries(tramites).map(([id, tramite]) => (
                  <Col md={6} lg={4} key={id} className="mb-3">
                    <Card className="tramite-stat-card">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="tramite-icon-small">
                            <i className="fas fa-file-alt"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{tramite.nombre}</h6>
                            <Badge bg="primary">
                              {stats?.tramitesStats?.[id] || 0} consultas
                            </Badge>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div className="text-center mt-4">
                <button className="btn btn-outline-primary" onClick={loadStats}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Actualizar Estadísticas
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Stats; 