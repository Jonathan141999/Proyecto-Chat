// Estructura de datos para los trámites municipales
export const tramites = {
  licenciaComercial: {
    id: 'licenciaComercial',
    nombre: 'Licencia Comercial',
    descripcion: 'Permiso para operar un negocio comercial',
    preguntas: [
      {
        id: 1,
        pregunta: '¿Qué tipo de negocio planeas abrir?',
        opciones: [
          { texto: 'Restaurante', siguiente: 2 },
          { texto: 'Tienda de ropa', siguiente: 2 },
          { texto: 'Servicios profesionales', siguiente: 2 },
          { texto: 'Otro', siguiente: 2 }
        ]
      },
      {
        id: 2,
        pregunta: '¿Ya tienes un local físico?',
        opciones: [
          { texto: 'Sí, ya está alquilado', siguiente: 3 },
          { texto: 'Sí, es de mi propiedad', siguiente: 3 },
          { texto: 'No, aún estoy buscando', siguiente: 'requisitoLocal' }
        ]
      },
      {
        id: 3,
        pregunta: '¿Tienes todos los documentos de identidad vigentes?',
        opciones: [
          { texto: 'Sí, DNI y otros documentos', siguiente: 4 },
          { texto: 'No, necesito renovar', siguiente: 'requisitoDocumentos' }
        ]
      },
      {
        id: 4,
        pregunta: '¿El local cumple con las normas de seguridad?',
        opciones: [
          { texto: 'Sí, tiene salidas de emergencia y extintores', siguiente: 'resultadoExitoso' },
          { texto: 'No, necesito hacer mejoras', siguiente: 'requisitoSeguridad' }
        ]
      }
    ]
  },
  
  permisoConstruccion: {
    id: 'permisoConstruccion',
    nombre: 'Permiso de Construcción',
    descripcion: 'Autorización para construir o remodelar',
    preguntas: [
      {
        id: 1,
        pregunta: '¿Qué tipo de construcción planeas realizar?',
        opciones: [
          { texto: 'Casa nueva', siguiente: 2 },
          { texto: 'Remodelación', siguiente: 2 },
          { texto: 'Ampliación', siguiente: 2 },
          { texto: 'Edificio comercial', siguiente: 2 }
        ]
      },
      {
        id: 2,
        pregunta: '¿Tienes los planos arquitectónicos?',
        opciones: [
          { texto: 'Sí, firmados por un arquitecto', siguiente: 3 },
          { texto: 'No, necesito contratar un arquitecto', siguiente: 'requisitoPlanos' }
        ]
      },
      {
        id: 3,
        pregunta: '¿El terreno está en zona permitida para construcción?',
        opciones: [
          { texto: 'Sí, es zona residencial/comercial', siguiente: 4 },
          { texto: 'No estoy seguro', siguiente: 'requisitoZona' }
        ]
      },
      {
        id: 4,
        pregunta: '¿Tienes el presupuesto estimado?',
        opciones: [
          { texto: 'Sí, más de $50,000', siguiente: 'resultadoExitoso' },
          { texto: 'No, necesito calcular', siguiente: 'requisitoPresupuesto' }
        ]
      }
    ]
  },
  
  certificadoHabitabilidad: {
    id: 'certificadoHabitabilidad',
    nombre: 'Certificado de Habitabilidad',
    descripcion: 'Certificado que acredita que una vivienda es habitable',
    preguntas: [
      {
        id: 1,
        pregunta: '¿Para qué necesitas el certificado?',
        opciones: [
          { texto: 'Venta de propiedad', siguiente: 2 },
          { texto: 'Alquiler', siguiente: 2 },
          { texto: 'Hipoteca', siguiente: 2 },
          { texto: 'Otro trámite', siguiente: 2 }
        ]
      },
      {
        id: 2,
        pregunta: '¿La propiedad tiene servicios básicos?',
        opciones: [
          { texto: 'Sí, agua, luz y desagüe', siguiente: 3 },
          { texto: 'Falta alguno', siguiente: 'requisitoServicios' }
        ]
      },
      {
        id: 3,
        pregunta: '¿La construcción cumple con las normas de seguridad?',
        opciones: [
          { texto: 'Sí, está en buen estado', siguiente: 4 },
          { texto: 'Necesita reparaciones', siguiente: 'requisitoReparaciones' }
        ]
      },
      {
        id: 4,
        pregunta: '¿Tienes la documentación de la propiedad?',
        opciones: [
          { texto: 'Sí, título de propiedad', siguiente: 'resultadoExitoso' },
          { texto: 'No, necesito obtenerla', siguiente: 'requisitoDocumentacion' }
        ]
      }
    ]
  },
  
  licenciaFuncionamiento: {
    id: 'licenciaFuncionamiento',
    nombre: 'Licencia de Funcionamiento',
    descripcion: 'Permiso para operar un establecimiento',
    preguntas: [
      {
        id: 1,
        pregunta: '¿Qué tipo de establecimiento es?',
        opciones: [
          { texto: 'Restaurante/Bar', siguiente: 2 },
          { texto: 'Tienda comercial', siguiente: 2 },
          { texto: 'Taller mecánico', siguiente: 2 },
          { texto: 'Oficina', siguiente: 2 }
        ]
      },
      {
        id: 2,
        pregunta: '¿El local tiene el área mínima requerida?',
        opciones: [
          { texto: 'Sí, más de 20m²', siguiente: 3 },
          { texto: 'No, es muy pequeño', siguiente: 'requisitoArea' }
        ]
      },
      {
        id: 3,
        pregunta: '¿Tienes el certificado de defensa civil?',
        opciones: [
          { texto: 'Sí, está vigente', siguiente: 4 },
          { texto: 'No, necesito obtenerlo', siguiente: 'requisitoDefensaCivil' }
        ]
      },
      {
        id: 4,
        pregunta: '¿El negocio está registrado en SUNAT?',
        opciones: [
          { texto: 'Sí, RUC activo', siguiente: 'resultadoExitoso' },
          { texto: 'No, necesito registrarme', siguiente: 'requisitoSUNAT' }
        ]
      }
    ]
  },
  
  permisoEventos: {
    id: 'permisoEventos',
    nombre: 'Permiso para Eventos',
    descripcion: 'Autorización para realizar eventos públicos',
    preguntas: [
      {
        id: 1,
        pregunta: '¿Qué tipo de evento planeas realizar?',
        opciones: [
          { texto: 'Fiesta privada', siguiente: 2 },
          { texto: 'Evento público', siguiente: 2 },
          { texto: 'Feria comercial', siguiente: 2 },
          { texto: 'Concierto/Show', siguiente: 2 }
        ]
      },
      {
        id: 2,
        pregunta: '¿Cuántas personas esperas?',
        opciones: [
          { texto: 'Menos de 50 personas', siguiente: 3 },
          { texto: 'Entre 50 y 200 personas', siguiente: 3 },
          { texto: 'Más de 200 personas', siguiente: 'requisitoCapacidad' }
        ]
      },
      {
        id: 3,
        pregunta: '¿Tienes un lugar específico?',
        opciones: [
          { texto: 'Sí, local cerrado', siguiente: 4 },
          { texto: 'Sí, espacio público', siguiente: 'requisitoPermisoPublico' },
          { texto: 'No, necesito buscar', siguiente: 'requisitoLugar' }
        ]
      },
      {
        id: 4,
        pregunta: '¿El evento será en horario permitido?',
        opciones: [
          { texto: 'Sí, antes de las 11 PM', siguiente: 'resultadoExitoso' },
          { texto: 'No, será más tarde', siguiente: 'requisitoHorario' }
        ]
      }
    ]
  }
};

// Resultados y requisitos
export const resultados = {
  resultadoExitoso: {
    tipo: 'exito',
    titulo: '¡Puedes proceder con el trámite!',
    mensaje: 'Cumples con todos los requisitos básicos. Puedes acercarte a la municipalidad con los documentos necesarios.',
    pasos: [
      'Reúne todos los documentos requeridos',
      'Acude a la ventanilla correspondiente',
      'Paga los derechos de trámite',
      'Espera la revisión y aprobación'
    ]
  },
  requisitoLocal: {
    tipo: 'requisito',
    titulo: 'Necesitas un local físico',
    mensaje: 'Para obtener una licencia comercial, primero debes tener un local físico.',
    pasos: [
      'Busca y alquila un local comercial',
      'Verifica que esté en zona permitida',
      'Asegúrate de que cumpla con las normas de seguridad',
      'Vuelve a consultar cuando tengas el local'
    ]
  },
  requisitoDocumentos: {
    tipo: 'requisito',
    titulo: 'Documentos de identidad requeridos',
    mensaje: 'Necesitas tener todos tus documentos de identidad vigentes.',
    pasos: [
      'Renueva tu DNI si está vencido',
      'Obtén certificados adicionales si son necesarios',
      'Verifica que todos estén en buen estado',
      'Vuelve a consultar cuando tengas todo listo'
    ]
  },
  requisitoSeguridad: {
    tipo: 'requisito',
    titulo: 'Mejoras de seguridad necesarias',
    mensaje: 'El local debe cumplir con las normas de seguridad básicas.',
    pasos: [
      'Instala extintores de incendio',
      'Verifica las salidas de emergencia',
      'Revisa la instalación eléctrica',
      'Contacta a un inspector de seguridad'
    ]
  },
  requisitoPlanos: {
    tipo: 'requisito',
    titulo: 'Planos arquitectónicos requeridos',
    mensaje: 'Necesitas planos firmados por un arquitecto colegiado.',
    pasos: [
      'Contrata un arquitecto colegiado',
      'Solicita los planos del proyecto',
      'Asegúrate de que estén firmados y sellados',
      'Vuelve a consultar cuando tengas los planos'
    ]
  },
  requisitoZona: {
    tipo: 'requisito',
    titulo: 'Verificación de zona requerida',
    mensaje: 'Debes verificar que el terreno esté en zona permitida para construcción.',
    pasos: [
      'Consulta el plan de desarrollo urbano',
      'Verifica la zonificación del terreno',
      'Consulta con un urbanista si es necesario',
      'Vuelve a consultar cuando tengas la información'
    ]
  },
  requisitoPresupuesto: {
    tipo: 'requisito',
    titulo: 'Presupuesto estimado requerido',
    mensaje: 'Necesitas tener un presupuesto estimado del proyecto.',
    pasos: [
      'Calcula los costos de materiales',
      'Incluye costos de mano de obra',
      'Considera gastos administrativos',
      'Vuelve a consultar cuando tengas el presupuesto'
    ]
  },
  requisitoServicios: {
    tipo: 'requisito',
    titulo: 'Servicios básicos requeridos',
    mensaje: 'La propiedad debe tener todos los servicios básicos funcionando.',
    pasos: [
      'Verifica la conexión de agua potable',
      'Revisa la instalación eléctrica',
      'Comprueba el sistema de desagüe',
      'Contacta a las empresas de servicios si es necesario'
    ]
  },
  requisitoReparaciones: {
    tipo: 'requisito',
    titulo: 'Reparaciones necesarias',
    mensaje: 'La propiedad necesita reparaciones antes de obtener el certificado.',
    pasos: [
      'Identifica los problemas estructurales',
      'Contrata profesionales para las reparaciones',
      'Realiza las mejoras necesarias',
      'Vuelve a consultar cuando esté en buen estado'
    ]
  },
  requisitoDocumentacion: {
    tipo: 'requisito',
    titulo: 'Documentación de propiedad requerida',
    mensaje: 'Necesitas la documentación que acredite la propiedad.',
    pasos: [
      'Obtén el título de propiedad',
      'Verifica que esté inscrito en registros públicos',
      'Asegúrate de que esté al día con impuestos',
      'Vuelve a consultar cuando tengas la documentación'
    ]
  },
  requisitoArea: {
    tipo: 'requisito',
    titulo: 'Área mínima requerida',
    mensaje: 'El local debe tener el área mínima requerida para el tipo de negocio.',
    pasos: [
      'Verifica las dimensiones del local',
      'Consulta los requisitos específicos para tu tipo de negocio',
      'Considera buscar un local más grande',
      'Vuelve a consultar cuando tengas un local adecuado'
    ]
  },
  requisitoDefensaCivil: {
    tipo: 'requisito',
    titulo: 'Certificado de Defensa Civil requerido',
    mensaje: 'Necesitas el certificado de defensa civil para el local.',
    pasos: [
      'Contacta a Defensa Civil',
      'Solicita una inspección del local',
      'Realiza las mejoras que indiquen',
      'Obtén el certificado correspondiente'
    ]
  },
  requisitoSUNAT: {
    tipo: 'requisito',
    titulo: 'Registro en SUNAT requerido',
    mensaje: 'El negocio debe estar registrado en SUNAT.',
    pasos: [
      'Registra tu negocio en SUNAT',
      'Obtén el RUC correspondiente',
      'Verifica que esté activo',
      'Vuelve a consultar cuando tengas el RUC'
    ]
  },
  requisitoCapacidad: {
    tipo: 'requisito',
    titulo: 'Capacidad limitada',
    mensaje: 'Para eventos con más de 200 personas se requieren permisos especiales.',
    pasos: [
      'Contacta directamente a la municipalidad',
      'Solicita permisos especiales',
      'Considera reducir el número de invitados',
      'Consulta requisitos adicionales de seguridad'
    ]
  },
  requisitoPermisoPublico: {
    tipo: 'requisito',
    titulo: 'Permiso de espacio público requerido',
    mensaje: 'Para usar espacios públicos necesitas permisos adicionales.',
    pasos: [
      'Solicita permiso de uso de espacio público',
      'Presenta plan de seguridad',
      'Obtén autorización de tránsito si es necesario',
      'Vuelve a consultar cuando tengas los permisos'
    ]
  },
  requisitoLugar: {
    tipo: 'requisito',
    titulo: 'Lugar específico requerido',
    mensaje: 'Necesitas definir el lugar exacto del evento.',
    pasos: [
      'Busca y reserva un local adecuado',
      'Verifica la capacidad del lugar',
      'Asegúrate de que cumpla con las normas',
      'Vuelve a consultar cuando tengas el lugar definido'
    ]
  },
  requisitoHorario: {
    tipo: 'requisito',
    titulo: 'Horario no permitido',
    mensaje: 'Los eventos después de las 11 PM requieren permisos especiales.',
    pasos: [
      'Considera cambiar el horario del evento',
      'Solicita permiso especial si es necesario',
      'Verifica las ordenanzas municipales',
      'Vuelve a consultar con un horario permitido'
    ]
  }
}; 