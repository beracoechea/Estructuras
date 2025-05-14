import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import './Modal.css'; // Asegúrate de que este CSS se adapte

export const AddEstadoCuentaModal = ({ isOpen, onClose, onSave, estructuraId }) => {
    const [nombreBanco, setNombreBanco] = useState('');
    const [cuentaClabe, setCuentaClabe] = useState('');
    const [fechaApertura, setFechaApertura] = useState(''); // Formato YYYY-MM-DD

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setNombreBanco('');
        setCuentaClabe('');
        setFechaApertura('');
        setError('');
    };

    const handleClose = () => {
        if (!isSaving) {
            resetForm();
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!nombreBanco.trim()) { setError('El campo "Nombre del Banco" es obligatorio.'); return; }
        if (!cuentaClabe.trim()) { setError('El campo "Cuenta CLABE" es obligatorio.'); return; }
        if (!/^\d{18}$/.test(cuentaClabe.trim())) { setError('La "Cuenta CLABE" debe tener 18 dígitos.'); return; }
        if (!fechaApertura) { setError('El campo "Fecha de Apertura" es obligatorio.'); return; }

        setIsSaving(true);
        try {
            const parts = fechaApertura.split('-'); // YYYY-MM-DD
            const fechaAperturaDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));

            const nuevaCuentaBancaria = {
                nombreBanco: nombreBanco.trim(),
                cuentaClabe: cuentaClabe.trim(),
                fechaApertura: Timestamp.fromDate(fechaAperturaDate),
                fechaRegistroDoc: Timestamp.now(),
                ...(estructuraId && { estructuraId: estructuraId })
            };

            await onSave(nuevaCuentaBancaria);
            // resetForm(); // Idealmente, el componente padre cierra el modal y resetea si es necesario
            // onClose(); // O el onSave se encarga de cerrar
        } catch (err) {
            console.error("Error guardando cuenta bancaria (modal):", err);
            setError(err.message || "No se pudo guardar la cuenta bancaria.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content modal-add-cuenta-bancaria" onClick={e => e.stopPropagation()}>
                <h2>
                    Añadir Nueva Cuenta Bancaria
                    {estructuraId ? ` a Estructura (ID: ${estructuraId.slice(0, 6)}...)` : ''}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="add-cb-nombreBanco">Nombre del Banco (*):</label>
                        <input type="text" id="add-cb-nombreBanco" value={nombreBanco} onChange={e => setNombreBanco(e.target.value)} disabled={isSaving} autoFocus />
                    </div>

                    <div className="form-group-inline-pair">
                        <div className="form-group-inline">
                            <label htmlFor="add-cb-cuentaClabe">Cuenta CLABE (*):</label>
                            <input type="text" id="add-cb-cuentaClabe" value={cuentaClabe} onChange={e => setCuentaClabe(e.target.value)} disabled={isSaving} maxLength="18" placeholder="18 dígitos" />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="add-cb-fechaApertura">Fecha de Apertura (*):</label>
                            <input type="date" id="add-cb-fechaApertura" value={fechaApertura} onChange={e => setFechaApertura(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>

                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Cuenta'}
                        </button>
                        <button type="button" className="button-cancel" onClick={handleClose} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
                <button className="modal-close-button" onClick={handleClose} disabled={isSaving} aria-label="Cerrar modal">&times;</button>
            </div>
        </div>
    );
};