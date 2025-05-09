import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import './Modal.css';

// Opciones para el selector de mes
const MESES_OPTIONS = [
    { value: '', label: '-- Seleccione Mes --' },
    { value: 'ENE', label: 'Enero' }, { value: 'FEB', label: 'Febrero' },
    { value: 'MAR', label: 'Marzo' }, { value: 'ABR', label: 'Abril' },
    { value: 'MAY', label: 'Mayo' }, { value: 'JUN', label: 'Junio' },
    { value: 'JUL', label: 'Julio' }, { value: 'AGO', label: 'Agosto' },
    { value: 'SEP', label: 'Septiembre' }, { value: 'OCT', label: 'Octubre' },
    { value: 'NOV', label: 'Noviembre' }, { value: 'DIC', label: 'Diciembre' }
];

export const AddEstadoCuentaModal = ({ isOpen, onClose, onSave, estructuraId }) => {
    const [linkAcceso, setLinkAcceso] = useState('');
    const [banco, setBanco] = useState('');
    const [numeroCuenta, setNumeroCuenta] = useState('');
    const [clabe, setClabe] = useState('');
    const [actualizacionesDomicilio, setActualizacionesDomicilio] = useState('');
    const [idObjeto, setIdObjeto] = useState('');
    const [estatus, setEstatus] = useState('');
    const [ano, setAno] = useState(new Date().getFullYear());
    const [observaciones, setObservaciones] = useState('');

    // --- NUEVO ESTADO PARA EL MES SELECCIONADO ---
    const [mes, setMes] = useState(''); // Valor del mes (ej. 'ENE', 'FEB')

    // --- ELIMINADO EL ESTADO mesesSeleccionados ---

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setLinkAcceso(''); setBanco(''); setNumeroCuenta(''); setClabe('');
        setActualizacionesDomicilio(''); setIdObjeto(''); setEstatus('');
        setAno(new Date().getFullYear()); setObservaciones('');
        setMes(''); // <-- Resetear nuevo estado
        // setMesesSeleccionados(initialMesesState); // <-- ELIMINADO
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // handleMonthChange ya no es necesario

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!banco.trim()) { setError('El campo "Banco" es obligatorio.'); return; }
        if (!ano) { setError('El campo "Año" es obligatorio.'); return; }
        const parsedAno = parseInt(ano);
        if (isNaN(parsedAno) || String(parsedAno).length !== 4) { setError('El "Año" debe ser un número de 4 dígitos.'); return; }
        // --- NUEVA VALIDACIÓN PARA EL MES ---
        if (!mes) { setError('Debe seleccionar un Mes para el estado de cuenta.'); return; }

        setIsSaving(true);
        try {
            const nuevoEstadoCuenta = {
                linkAcceso: linkAcceso.trim(),
                banco: banco.trim(),
                numeroCuenta: numeroCuenta.trim(),
                clabe: clabe.trim(),
                idObjeto: idObjeto.trim(),
                actualizacionesDomicilio: actualizacionesDomicilio.trim(),               
                mes: mes,
                ano: parsedAno,
                observaciones: observaciones.trim(),
                fechaRegistro: Timestamp.now(), // Timestamp del cliente al momento de preparar el guardado
            };
            await onSave(nuevoEstadoCuenta);
            resetForm();
        } catch (err) {
            console.error("Error guardando estado de cuenta (modal):", err);
            setError(err.message || "No se pudo guardar el estado de cuenta.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={!isSaving ? handleClose : undefined}>
            <div className="modal-content modal-estado-cuenta" onClick={e => e.stopPropagation()}>
                <h2>Añadir Estado de Cuenta {estructuraId ? `a Estructura (ID: ${estructuraId.slice(0,6)}...)` : ''}</h2>
                <form onSubmit={handleSubmit}>
                    {/* Campos del formulario */}
                    <div className="form-group">
                        <label htmlFor="add-ec-banco">Banco (*):</label>
                        <input type="text" id="add-ec-banco" value={banco} onChange={e => setBanco(e.target.value)} disabled={isSaving} autoFocus />
                    </div>

                    <div className="form-group-inline-pair">
                        <div className="form-group-inline">
                            <label htmlFor="add-ec-numeroCuenta">Número de Cuenta:</label>
                            <input type="text" id="add-ec-numeroCuenta" value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="add-ec-clabe">CLABE:</label>
                            <input type="text" id="add-ec-clabe" value={clabe} onChange={e => setClabe(e.target.value)} disabled={isSaving} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="add-ec-idObjeto">ID/Objeto del Estado de Cuenta:</label>
                        <input type="text" id="add-ec-idObjeto" value={idObjeto} onChange={e => setIdObjeto(e.target.value)} placeholder="Ej. Préstamo XYZ, Cuenta Principal" disabled={isSaving} />
                    </div>

                    <div className="form-group-inline-pair">
                         <div className="form-group-inline">
                            <label htmlFor="add-ec-ano">Año (*):</label>
                            <input type="number" id="add-ec-ano" value={ano} onChange={e => setAno(e.target.value)} placeholder="YYYY" min="1900" max="2100" disabled={isSaving} />
                        </div>
                         {/* --- REEMPLAZO DE CHECKBOXES POR SELECTOR DE MES --- */}
                         <div className="form-group-inline">
                            <label htmlFor="add-ec-mes">Mes (*):</label>
                            <select id="add-ec-mes" value={mes} onChange={e => setMes(e.target.value)} disabled={isSaving} required>
                                {MESES_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value} disabled={option.value === ''}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="add-ec-estatus">Estatus del Estado de Cuenta:</label>
                        <input type="text" id="add-ec-estatus" value={estatus} onChange={e => setEstatus(e.target.value)} placeholder="Ej. Conciliado, Pendiente" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-ec-linkAcceso">Link de Acceso (URL):</label>
                        <input type="url" id="add-ec-linkAcceso" value={linkAcceso} onChange={e => setLinkAcceso(e.target.value)} placeholder="https://" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-ec-actualizacionesDomicilio">Actualizaciones de Domicilio:</label>
                        <textarea id="add-ec-actualizacionesDomicilio" value={actualizacionesDomicilio} onChange={e => setActualizacionesDomicilio(e.target.value)} rows="3" disabled={isSaving}></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="add-ec-observaciones">Observaciones Generales:</label>
                        <textarea id="add-ec-observaciones" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows="3" disabled={isSaving}></textarea>
                    </div>

                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Estado de Cuenta'}
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