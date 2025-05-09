// src/modals/EditExpedienteModal.jsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import './Modal.css';

const timestampToInputDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    try {
        const date = timestamp.toDate();
        // Forzar la interpretación como UTC para evitar problemas de zona horaria con el input date
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error convirtiendo timestamp a string de fecha:", e);
        return '';
    }
};

export const EditExpedienteModal = ({ isOpen, onClose, onUpdateExpediente, initialData }) => {
    const [nombreDoc, setNombreDoc] = useState('');
    const [numero, setNumero] = useState('');
    const [fecha, setFecha] = useState(''); // string YYYY-MM-DD
    const [estatus, setEstatus] = useState('');
    const [linkDigital, setLinkDigital] = useState('');
    const [ubicacionFisica, setUbicacionFisica] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [original, setOriginal] = useState(0);
    const [copiasCertificadas, setCopiasCertificadas] = useState(0);
    const [fechaVencimiento, setFechaVencimiento] = useState(''); // <-- NUEVO ESTADO

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (initialData && isOpen) {
            setNombreDoc(initialData.nombre || '');
            setNumero(initialData.numero || '');
            setFecha(timestampToInputDate(initialData.fecha));
            setEstatus(initialData.estatus || '');
            setLinkDigital(initialData.linkDigital || '');
            setUbicacionFisica(initialData.ubicacionFisica || '');
            setObservaciones(initialData.observaciones || '');
            setOriginal(initialData.original || 0);
            setCopiasCertificadas(initialData.copiasCertificadas || 0);
            setFechaVencimiento(timestampToInputDate(initialData.fechaVencimiento)); // <-- CARGAR NUEVO ESTADO
            setError('');
            setSuccessMessage('');
        } else if (!isOpen) { // Limpiar el formulario si el modal se cierra externamente
            setNombreDoc('');
            setNumero('');
            setFecha('');
            setEstatus('');
            setLinkDigital('');
            setUbicacionFisica('');
            setObservaciones('');
            setOriginal(0);
            setCopiasCertificadas(0);
            setFechaVencimiento('');
            setError('');
            setSuccessMessage('');
        }
    }, [initialData, isOpen]);

    const handleClose = () => {
        setError('');
        setSuccessMessage('');
        // No es necesario resetear aquí explícitamente si useEffect ya lo maneja al cambiar isOpen
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
    
        // Validaciones básicas
        if (!nombreDoc.trim()) {
            setError('El nombre del Documento/Expediente es obligatorio.');
            return;
        }
        if (!fecha) {
            setError('La Fecha es obligatoria.');
            return;
        }
    
        // Validación de fechas
        if (fechaVencimiento) {
            try {
                new Date(fechaVencimiento); // Prueba si es una fecha válida
            } catch (e) {
                setError('Fecha de vencimiento inválida.');
                return;
            }
    
            if (new Date(fechaVencimiento) < new Date(fecha)) {
                setError('La fecha de vencimiento no puede ser anterior a la fecha del documento.');
                return;
            }
        }
    
        setIsSaving(true);
    
        try {
            const expedienteActualizado = {
                nombre: nombreDoc.trim(),
                numero: numero.trim(),
                fecha, // Se pasa como string YYYY-MM-DD
                estatus: estatus.trim(),
                linkDigital: linkDigital.trim(),
                ubicacionFisica: ubicacionFisica.trim(),
                observaciones: observaciones.trim(),
                original: parseInt(original) || 0,
                copiasCertificadas: parseInt(copiasCertificadas) || 0,
                fechaVencimiento: fechaVencimiento || null // Puede ser null si está vacío
            };
    
            await onUpdateExpediente(initialData.id, expedienteActualizado);
    
            setSuccessMessage("✅ Expediente actualizado correctamente");
            setTimeout(() => handleClose(), 1500);
    
        } catch (err) {
            console.error("Error completo al actualizar:", err);
            setError(err.message || "Ocurrió un error al actualizar el expediente.");
        } finally {
            setIsSaving(false);
        }
    };
    if (!isOpen || !initialData) return null;

    return (
        <div className="modal-overlay" onClick={!isSaving ? handleClose : undefined}>
            <div className="modal-content modal-documento" onClick={e => e.stopPropagation()}>
                <h2>Editar Expediente <span className="modal-id">(ID: {initialData.id ? initialData.id.slice(0,6) + '...' : 'N/A'})</span></h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-exp-nombre">Documento/Nombre Expediente (*):</label>
                        <input type="text" id="edit-exp-nombre" value={nombreDoc} onChange={e => setNombreDoc(e.target.value)} disabled={isSaving} autoFocus />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-exp-numero">Número:</label>
                        <input type="text" id="edit-exp-numero" value={numero} onChange={e => setNumero(e.target.value)} disabled={isSaving} />
                    </div>
                    {/* Fechas lado a lado */}
                    <div className="form-group-inline">
                        <div className="form-group">
                            <label htmlFor="edit-exp-fecha">Fecha del Documento (*):</label>
                            <input type="date" id="edit-exp-fecha" value={fecha} onChange={e => setFecha(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="form-group"> 
                            <label htmlFor="edit-exp-fechaVencimiento">Fecha de Vencimiento:</label>
                            <input type="date" id="edit-exp-fechaVencimiento" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-exp-estatus">Estatus:</label>
                        <input type="text" id="edit-exp-estatus" value={estatus} onChange={e => setEstatus(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-exp-link">Link Digital (URL):</label>
                        <input type="url" id="edit-exp-link" value={linkDigital} onChange={e => setLinkDigital(e.target.value)} placeholder="https://" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-exp-ubicacion">Ubicación Física:</label>
                        <input type="text" id="edit-exp-ubicacion" value={ubicacionFisica} onChange={e => setUbicacionFisica(e.target.value)} disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-exp-observaciones">Observaciones:</label>
                        <textarea id="edit-exp-observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows="3" disabled={isSaving}></textarea>
                    </div>
                    <div className="form-group form-group-inline-pair">
                        <div className="form-group-inline">
                            <label htmlFor="edit-exp-original">Original (Cant.):</label>
                            <input type="number" id="edit-exp-original" value={original} min="0" onChange={e => setOriginal(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="edit-exp-copias">Copias Cert. (Cant.):</label>
                            <input type="number" id="edit-exp-copias" value={copiasCertificadas} min="0" onChange={e => setCopiasCertificadas(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>

                    {error && <p className="modal-error">{error}</p>}
                    {successMessage && <p className="modal-success">{successMessage}</p>}

                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Actualizando...' : 'Guardar Cambios'}
                        </button>
                        <button type="button" className="button-cancel" onClick={handleClose} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
                <button className="modal-close-button" onClick={!isSaving ? handleClose : undefined} disabled={isSaving} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};