import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firestore } from '../../config/firebase-config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { usePrestamosLogic } from '../../hooks/usePrestamosLogic';
import './ExpedienteDetalle.css';

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    const parts = timestamp.split('-');
    if (parts.length === 3) {
      date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    } else {
      date = new Date(timestamp);
    }
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'Fecha inválida';
  }
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleDateString('es-MX', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'});
};

const PrestamoItem = ({ prestamo, onMarcarEntregado, isProcessing }) => {
  return (
    <div className="prestamo-item">
      <div className="prestamo-info">
        <p><strong>Fecha Préstamo:</strong> {formatDate(prestamo.fechaPrestamo)}</p>
        <p><strong>Copias Prestadas:</strong> {prestamo.cantidadCopiasPrestadas}</p>
        <p><strong>Observaciones:</strong> {prestamo.observaciones || 'N/A'}</p>
        <p><strong>Fecha Registro:</strong> {formatDate(prestamo.fechaRegistroPrestamo)}</p>
      </div>
      <button
        className="button-entregar"
        onClick={() => onMarcarEntregado(prestamo.id)}
        disabled={isProcessing}
      >
        {isProcessing ? 'Procesando...' : 'Marcar como Entregado'}
      </button>
    </div>
  );
};

export const ExpedienteDetalle = () => {
  const { expedienteId } = useParams();
  const navigate = useNavigate();
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estructuraNombre, setEstructuraNombre] = useState('');
  const [prestamos, setPrestamos] = useState([]);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  
  // Extraer correctamente las funciones del hook
  const { 
    marcarPrestamoEntregado,
    isProcessingEntrega 
  } = usePrestamosLogic();

  // Obtener datos del expediente
  useEffect(() => {
    const fetchExpediente = async () => {
      if (!expedienteId) {
        setError("No se proporcionó ID de expediente.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const expDocRef = doc(firestore, "Expedientes", expedienteId);
        const docSnap = await getDoc(expDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setExpediente({ id: docSnap.id, ...data });

          if (data.estructuraId) {
            try {
              const estDocRef = doc(firestore, "Estructuras", data.estructuraId);
              const estDocSnap = await getDoc(estDocRef);
              if (estDocSnap.exists() && estDocSnap.data().RazonSocial) {
                setEstructuraNombre(estDocSnap.data().RazonSocial);
              }
            } catch (estError) {
              console.warn("No se pudo obtener el nombre de la estructura:", estError);
              setEstructuraNombre(`ID: ${data.estructuraId}`);
            }
          }
        } else {
          setError("No se encontró el expediente con el ID proporcionado.");
          setExpediente(null);
        }
      } catch (err) {
        console.error("Error buscando expediente:", err);
        setError("Ocurrió un error al cargar la información del expediente.");
      } finally {
        setLoading(false);
      }
    };

    fetchExpediente();
  }, [expedienteId]);

  // Obtener préstamos del expediente
  useEffect(() => {
    const fetchPrestamos = async () => {
      if (!expedienteId) return;
      
      setLoadingPrestamos(true);
      try {
        const q = query(
          collection(firestore, "Prestamos"),
          where("expedienteId", "==", expedienteId),
          where("estatusPrestamo", "==", "Prestado")
        );
        const querySnapshot = await getDocs(q);
        const prestamosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPrestamos(prestamosData);
      } catch (err) {
        console.error("Error cargando préstamos:", err);
      } finally {
        setLoadingPrestamos(false);
      }
    };

    fetchPrestamos();
  }, [expedienteId]);

  const handleMarcarEntregado = async (prestamoId) => {
    if (!window.confirm("¿Estás seguro de marcar este préstamo como entregado?")) return;
    
    try {
      await marcarPrestamoEntregado(prestamoId, expedienteId);
      setPrestamos(prestamos.filter(p => p.id !== prestamoId));
      
      // Actualizar datos del expediente para reflejar copias devueltas
      const expedienteDoc = await getDoc(doc(firestore, "Expedientes", expedienteId));
      if (expedienteDoc.exists()) {
        setExpediente({ id: expedienteDoc.id, ...expedienteDoc.data() });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="status-container"><p>Cargando expediente...</p></div>;
  if (error) return <div className="status-container error"><p>{error}</p></div>;
  if (!expediente) return <div className="status-container"><p>No hay datos para mostrar.</p></div>;
  return (
    <div className="expediente-detalle-container">
      <button onClick={() => navigate(-1)} className="button-back">&larr; Volver</button>

      <h1>Detalle del Expediente: {expediente.nombre || 'Sin Nombre'}</h1>
      
      {expediente.estructuraId && (
        <p className="estructura-info">
          Pertenece a la Estructura: {' '}
          {estructuraNombre ? (
            <Link to={`/estructuras/${expediente.estructuraId}`} title={`Ver estructura ${estructuraNombre}`}>
              {estructuraNombre}
            </Link>
          ) : (
            `ID: ${expediente.estructuraId}`
          )}
        </p>
      )}

      <div className="detalle-seccion">
        <h2>Información Principal</h2>
        <p><strong>Nombre:</strong> {expediente.nombre || 'N/A'}</p>
        <p><strong>Número:</strong> {expediente.numero || 'N/A'}</p>
        <p><strong>Fecha del Documento:</strong> {formatDate(expediente.fecha)}</p>
        <p><strong>Estatus Actual:</strong> {expediente.estatus || 'N/A'}</p>
        <p><strong>Fecha de Vencimiento:</strong> {formatDate(expediente.fechaVencimiento)}</p>
      </div>

      <div className="detalle-seccion">
        <h2>Ubicación y Acceso</h2>
        <p>
          <strong>Link Digital:</strong>{' '}
          {expediente.linkDigital ? (
            <a href={expediente.linkDigital.startsWith('http') ? expediente.linkDigital : `//${expediente.linkDigital}`} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="link-acceso">
              Abrir Link
            </a>
          ) : 'N/A'}
        </p>
        <p><strong>Ubicación Física:</strong> {expediente.ubicacionFisica || 'N/A'}</p>
      </div>

      <div className="detalle-seccion">
        <h2>Detalles Adicionales</h2>
        <p><strong>Cantidad Original:</strong> {expediente.original ?? 'N/A'}</p>
        <p><strong>Cantidad Copias Certificadas:</strong> {expediente.copiasCertificadas ?? 'N/A'}</p>
        <div className="text-area-display">
          <strong>Observaciones:</strong>
          <pre>{expediente.observaciones || 'N/A'}</pre>
        </div>
      </div>

      <div className="detalle-seccion metadata">
        <p><small>Fecha de Registro en Sistema: {formatDate(expediente.fechaRegistro)}</small></p>
        {expediente.fechaActualizacion && <p><small>Última Actualización: {formatDate(expediente.fechaActualizacion)}</small></p>}
      </div>

       <div className="detalle-seccion">
        <h2>Préstamos Activos</h2>
        {loadingPrestamos ? (
          <p>Cargando préstamos...</p>
        ) : prestamos.length === 0 ? (
          <p>No hay préstamos activos para este expediente.</p>
        ) : (
          <div className="prestamos-list">
            {prestamos.map(prestamo => (
              <PrestamoItem
                key={prestamo.id}
                prestamo={prestamo}
                onMarcarEntregado={handleMarcarEntregado}
                isProcessing={isProcessingEntrega}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};