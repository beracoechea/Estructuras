// src/modals/EditEstadoCuentaModal.jsx
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import './Modal.css'; // Reutiliza o crea estilos específicos

// Opciones para el selector de mes (puedes moverlo a un archivo de constantes si se comparte)
const MESES_OPTIONS = [
    { value: '', label: '-- Seleccione Mes --' },
    { value: 'ENE', label: 'Enero' }, { value: 'FEB', label: 'Febrero' },
    { value: 'MAR', label: 'Marzo' }, { value: 'ABR', label: 'Abril' },
    { value: 'MAY', label: 'Mayo' }, { value: 'JUN', label: 'Junio' },
    { value: 'JUL', label: 'Julio' }, { value: 'AGO', label: 'Agosto' },
    { value: 'SEP', label: 'Septiembre' }, { value: 'OCT', label: 'Octubre' },
    { value: 'NOV', label: 'Noviembre' }, { value: 'DIC', label: 'Diciembre' }
];

export const EditEstadoCuentaModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    const [formData, setFormData] = useState({
        linkAcceso: '',
        banco: '',
        numeroCuenta: '',
        clabe: '',
        actualizacionesDomicilio: '',
        idObjeto: '',
        estatus: '',
        ano: new Date().getFullYear(),
        mes: '',
        observaciones: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                linkAcceso: initialData.linkAcceso || '',
                banco: initialData.banco || '',
                numeroCuenta: initialData.numeroCuenta || '',
                clabe: initialData.clabe || '',
                actualizacionesDomicilio: initialData.actualizacionesDomicilio || '',
                idObjeto: initialData.idObjeto || '',
                estatus: initialData.estatus || '',
                ano: initialData.ano || new Date().getFullYear(),
                mes: initialData.mes || '',
                observaciones: initialData.observaciones || '',
            });
        } else {
            // Reset si no hay initialData (aunque no debería pasar si isOpen es true con initialData)
             setFormData({
                linkAcceso: '', banco: '', numeroCuenta: '', clabe: '',
                actualizacionesDomicilio: '', idObjeto: '', estatus: '',
                ano: new Date().getFullYear(), mes: '', observaciones: '',
            });
        }
    }, [initialData, isOpen]); // Recargar datos si initialData o isOpen cambian

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        // Permitir que el campo esté vacío para que el usuario pueda borrar antes de escribir
        // La validación de que sea un número válido se hará en el submit
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleClose = () => {
        setError('');
        // No es necesario resetear el form aquí, useEffect lo maneja basado en initialData
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.banco.trim()) { setError('El campo "Banco" es obligatorio.'); return; }
        if (!formData.ano) { setError('El campo "Año" es obligatorio.'); return; }
        const parsedAno = parseInt(formData.ano);
        if (isNaN(parsedAno) || String(parsedAno).length !== 4) { setError('El "Año" debe ser un número de 4 dígitos.'); return; }
        if (!formData.mes) { setError('Debe seleccionar un Mes para el estado de cuenta.'); return; }

        setIsSaving(true);
        try {
            const dataToUpdate = {
                ...formData, // Usar los datos del estado formData
                ano: parsedAno, // Asegurarse que el año sea número
            };
            // Quitar campos que no deben ir directamente a update si initialData los tuviera (como 'id' o 'fechaRegistro')
            // delete dataToUpdate.id;
            // delete dataToUpdate.fechaRegistro; // fechaActualizacion se pondrá en el hook

            await onUpdate(initialData.id, dataToUpdate); // initialData debe tener el ID
            // No resetear el form aquí, se cierra el modal
        } catch (err) {
            console.error("Error actualizando estado de cuenta (modal):", err);
            setError(err.message || "No se pudo actualizar el estado de cuenta.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !initialData) return null; // Asegurarse que hay initialData si está abierto

    return (
        <div className="modal-overlay" onClick={!isSaving ? handleClose : undefined}>
            <div className="modal-content modal-estado-cuenta" onClick={e => e.stopPropagation()}>
                <h2>Editar Estado de Cuenta (ID: {initialData.id.slice(0,6)}...)</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-ec-banco">Banco (*):</label>
                        <input type="text" id="edit-ec-banco" name="banco" value={formData.banco} onChange={handleChange} disabled={isSaving} autoFocus />
                    </div>

                    <div className="form-group-inline-pair">
                        <div className="form-group-inline">
                            <label htmlFor="edit-ec-numeroCuenta">Número de Cuenta:</label>
                            <input type="text" id="edit-ec-numeroCuenta" name="numeroCuenta" value={formData.numeroCuenta} onChange={handleChange} disabled={isSaving} />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="edit-ec-clabe">CLABE:</label>
                            <input type="text" id="edit-ec-clabe" name="clabe" value={formData.clabe} onChange={handleChange} disabled={isSaving} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-ec-idObjeto">ID/Objeto del Estado de Cuenta:</label>
                        <input type="text" id="edit-ec-idObjeto" name="idObjeto" value={formData.idObjeto} onChange={handleChange} placeholder="Ej. Préstamo XYZ, Cuenta Principal" disabled={isSaving} />
                    </div>

                    <div className="form-group-inline-pair">
                        <div className="form-group-inline">
                            <label htmlFor="edit-ec-ano">Año (*):</label>
                            <input type="number" id="edit-ec-ano" name="ano" value={formData.ano} onChange={handleNumericChange} placeholder="YYYY" min="1900" max="2100" disabled={isSaving} />
                        </div>
                        <div className="form-group-inline">
                            <label htmlFor="edit-ec-mes">Mes (*):</label>
                            <select id="edit-ec-mes" name="mes" value={formData.mes} onChange={handleChange} disabled={isSaving} required>
                                {MESES_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value} disabled={option.value === ''}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-ec-estatus">Estatus del Estado de Cuenta:</label>
                        <input type="text" id="edit-ec-estatus" name="estatus" value={formData.estatus} onChange={handleChange} placeholder="Ej. Conciliado, Pendiente" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-ec-linkAcceso">Link de Acceso (URL):</label>
                        <input type="url" id="edit-ec-linkAcceso" name="linkAcceso" value={formData.linkAcceso} onChange={handleChange} placeholder="https://" disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-ec-actualizacionesDomicilio">Actualizaciones de Domicilio:</label>
                        <textarea id="edit-ec-actualizacionesDomicilio" name="actualizacionesDomicilio" value={formData.actualizacionesDomicilio} onChange={handleChange} rows="3" disabled={isSaving}></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-ec-observaciones">Observaciones Generales:</label>
                        <textarea id="edit-ec-observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} rows="3" disabled={isSaving}></textarea>
                    </div>

                    {error && <p className="modal-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button-save" disabled={isSaving}>
                            {isSaving ? 'Guardando Cambios...' : 'Guardar Cambios'}
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