// src/modals/EditExpedienteModal.jsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import './Modal.css'; // Asegúrate que la ruta al CSS es correcta

const timestampToInputDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    try {
        const date = timestamp.toDate();
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error convirtiendo timestamp a string de fecha:", e);
        return '';
    }
};

// Opciones predefinidas para el estatus
const PREDEFINED_STATUS_OPTIONS = ["Extraviado", "Listo en carpeta", "En gestión"];
const OTRO_STATUS_VALUE = "Otro"; // Valor para la opción 'Otro' en el select

export const EditExpedienteModal = ({ isOpen, onClose, onUpdateExpediente, initialData }) => {
    const [nombreDoc, setNombreDoc] = useState('');
    const [numero, setNumero] = useState('');
    const [fecha, setFecha] = useState('');
    
    // Estado para el <select> de estatus
    const [selectedEstatus, setSelectedEstatus] = useState('');
    // Estado para el input de texto cuando se selecciona "Otro"
    const [customEstatusText, setCustomEstatusText] = useState('');
    
    const [linkDigital, setLinkDigital] = useState('');
    const [ubicacionFisica, setUbicacionFisica] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [original, setOriginal] = useState(0);
    const [copiasCertificadas, setCopiasCertificadas] = useState(0);
    const [fechaVencimiento, setFechaVencimiento] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (initialData && isOpen) {
            setNombreDoc(initialData.nombre || '');
            setNumero(initialData.numero || '');
            setFecha(timestampToInputDate(initialData.fecha));
            setLinkDigital(initialData.linkDigital || '');
            setUbicacionFisica(initialData.ubicacionFisica || '');
            setObservaciones(initialData.observaciones || '');
            setOriginal(initialData.original || 0);
            setCopiasCertificadas(initialData.copiasCertificadas || 0);
            setFechaVencimiento(timestampToInputDate(initialData.fechaVencimiento));

            // Lógica para inicializar los estados de 'Estatus'
            const initialStatusValue = initialData.estatus || '';
            if (PREDEFINED_STATUS_OPTIONS.includes(initialStatusValue)) {
                setSelectedEstatus(initialStatusValue);
                setCustomEstatusText('');
            } else if (initialStatusValue) { // Es un valor personalizado (o era 'Otro' previamente)
                setSelectedEstatus(OTRO_STATUS_VALUE);
                setCustomEstatusText(initialStatusValue);
            } else { // Sin estatus inicial o vacío
                setSelectedEstatus(''); // Para que se muestre "-- Seleccione --"
                setCustomEstatusText('');
            }

            setError('');
            setSuccessMessage('');
        } else if (!isOpen) {
            // Resetear todos los estados cuando el modal se cierra
            setNombreDoc('');
            setNumero('');
            setFecha('');
            setSelectedEstatus('');
            setCustomEstatusText('');
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
        // useEffect ya maneja el reseteo cuando isOpen cambia a false
        onClose();
    };

    const handleEstatusChange = (e) => {
        const newSelectedStatus = e.target.value;
        setSelectedEstatus(newSelectedStatus);
        if (newSelectedStatus !== OTRO_STATUS_VALUE) {
            setCustomEstatusText(''); // Limpiar el texto personalizado si se elige una opción predefinida
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!nombreDoc.trim()) {
            setError('El nombre del Documento/Expediente es obligatorio.');
            return;
        }
        if (!fecha) {
            setError('La Fecha del Documento es obligatoria.');
            return;
        }

        let finalEstatus = '';
        if (selectedEstatus === OTRO_STATUS_VALUE) {
            if (!customEstatusText.trim()) {
                setError('Si selecciona "Otro" para el estatus, debe especificar el valor.');
                return;
            }
            finalEstatus = customEstatusText.trim();
        } else {
            finalEstatus = selectedEstatus; // Puede ser "" si no se seleccionó nada y es permitido
        }
        
        // Validación de fechaVencimiento si existe
        if (fechaVencimiento) {
            try {
                 const fv = new Date(fechaVencimiento); // Intentar parsear
                 if (isNaN(fv.getTime())) throw new Error("Fecha inválida"); // Chequeo extra
            } catch (parseError) {
                setError('Fecha de vencimiento tiene un formato inválido.');
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
                fecha, // Se pasa como string YYYY-MM-DD, el hook lo convierte a Timestamp
                estatus: finalEstatus, // El valor final del estatus
                linkDigital: linkDigital.trim(),
                ubicacionFisica: ubicacionFisica.trim(),
                observaciones: observaciones.trim(),
                original: parseInt(original, 10) || 0,
                copiasCertificadas: parseInt(copiasCertificadas, 10) || 0,
                fechaVencimiento: fechaVencimiento ? fechaVencimiento : null // Enviar null si está vacío
            };

            // El hook onUpdateExpediente debe manejar la conversión de las strings de fecha a Timestamps
            await onUpdateExpediente(initialData.id, expedienteActualizado);

            setSuccessMessage("✅ Expediente actualizado correctamente");
            setTimeout(() => {
                handleClose(); // Cierra y resetea el formulario vía useEffect
            }, 1500);

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
                <h2>Editar Expediente <span className="modal-id">(ID: {initialData.id ? (typeof initialData.id === 'string' ? initialData.id.slice(0, 6) : initialData.id) + '...' : 'N/A'})</span></h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-exp-nombre">Documento/Nombre Expediente (*):</label>
                        <input type="text" id="edit-exp-nombre" value={nombreDoc} onChange={e => setNombreDoc(e.target.value)} disabled={isSaving} autoFocus />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-exp-numero">Número:</label>
                        <input type="text" id="edit-exp-numero" value={numero} onChange={e => setNumero(e.target.value)} disabled={isSaving} />
                    </div>

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

                    {/* Campo de Estatus Modificado */}
                    <div className="form-group">
                        <label htmlFor="edit-exp-estatus-picker">Estatus:</label>
                        <select
                            id="edit-exp-estatus-picker"
                            value={selectedEstatus}
                            onChange={handleEstatusChange}
                            disabled={isSaving}
                        >
                            <option value="">-- Seleccione Estatus --</option>
                            {PREDEFINED_STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value={OTRO_STATUS_VALUE}>Otro (especificar)</option>
                        </select>
                    </div>

                    {selectedEstatus === OTRO_STATUS_VALUE && (
                        <div className="form-group">
                            <label htmlFor="edit-exp-estatus-otro">Especifique Estatus :</label>
                            <input
                                type="text"
                                id="edit-exp-estatus-otro"
                                value={customEstatusText}
                                onChange={e => setCustomEstatusText(e.target.value)}
                                disabled={isSaving}
                                placeholder="Escriba el estatus personalizado"
                            />
                        </div>
                    )}
                    {/* Fin Campo de Estatus Modificado */}

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
                            <input type="number" id="edit-exp-original" value={original} min="0" onChange={e => setOriginal(String(e.target.value))} disabled={isSaving} />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="edit-exp-copias">Copias Cert. (Cant.):</label>
                            <input type="number" id="edit-exp-copias" value={copiasCertificadas} min="0" onChange={e => setCopiasCertificadas(String(e.target.value))} disabled={isSaving} />
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