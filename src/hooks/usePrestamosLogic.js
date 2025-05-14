// src/hooks/usePrestamosLogic.js
import { useState } from 'react';
import { firestore } from '../config/firebase-config';
import {
    collection,
    addDoc,
    Timestamp,
    deleteDoc,
    doc,
    // getDoc, // No se usará getDoc individualmente dentro de la transacción para el doc de expedientes
    // updateDoc, // Se usará transaction.update
    runTransaction
} from 'firebase/firestore';

const ESTRUCTURA_EXPEDIENTES_COLLECTION = "EstructuraExpedientes"; // Misma colección

export const usePrestamosLogic = () => {
    const [isAddPrestamoModalOpen, setIsAddPrestamoModalOpen] = useState(false);
    const [isSavingPrestamo, setIsSavingPrestamo] = useState(false);
    const [isProcessingEntrega, setIsProcessingEntrega] = useState(false);

    const openAddPrestamoModal = () => setIsAddPrestamoModalOpen(true);
    const closeAddPrestamoModal = () => setIsAddPrestamoModalOpen(false);

    // expedienteIdentificador es el 'nombre' o 'id' del expediente dentro del array
    // estructuraIdDelExpediente es el ID del documento en ESTRUCTURA_EXPEDIENTES_COLLECTION
    const marcarPrestamoEntregado = async (prestamoId, expedienteIdentificador, estructuraIdDelExpediente) => {
        if (!prestamoId || !expedienteIdentificador || !estructuraIdDelExpediente) {
            throw new Error("Faltan IDs de préstamo, expediente o estructura.");
        }

        setIsProcessingEntrega(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const prestamoRef = doc(firestore, "Prestamos", prestamoId);
                const prestamoDoc = await transaction.get(prestamoRef);
                if (!prestamoDoc.exists()) throw new Error("El préstamo no existe.");

                const prestamoData = prestamoDoc.data();
                const copiasPrestadas = prestamoData.cantidadCopiasPrestadas || 0;

                // Referencia al documento que contiene la lista de expedientes
                const estructuraExpedientesDocRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraIdDelExpediente);
                const estructuraExpedientesDoc = await transaction.get(estructuraExpedientesDocRef);
                if (!estructuraExpedientesDoc.exists()) throw new Error("El documento de expedientes de la estructura no existe.");

                let currentLista = estructuraExpedientesDoc.data().listaExpedientes || [];
                let expedienteFound = false;
                const updatedLista = currentLista.map(exp => {
                    if (exp.id === expedienteIdentificador || exp.nombre === expedienteIdentificador) {
                        expedienteFound = true;
                        const copiasActuales = exp.copiasCertificadas || 0;
                        return { ...exp, copiasCertificadas: copiasActuales + copiasPrestadas, fechaActualizacion: Timestamp.now() };
                    }
                    return exp;
                });

                if (!expedienteFound) throw new Error(`Expediente '${expedienteIdentificador}' no encontrado.`);

                transaction.update(estructuraExpedientesDocRef, { listaExpedientes: updatedLista });
                transaction.delete(prestamoRef);
            });
            return true;
        } catch (err) {
            console.error("Error en la transacción de entrega (new model):", err);
            throw new Error(err.message || "No se pudo completar la entrega.");
        } finally {
            setIsProcessingEntrega(false);
        }
    };

    // estructuraId es el ID de la estructura (y el ID del doc en EstructuraExpedientes)
    // expedienteIdentificador es el 'nombre' o 'id' del expediente dentro del array
    const saveNuevoPrestamo = async (nuevoPrestamoData, estructuraId, expedienteIdentificador) => {
        if (!estructuraId || !expedienteIdentificador) {
            throw new Error("Faltan IDs de estructura o identificador de expediente para el préstamo.");
        }

        setIsSavingPrestamo(true);
        try {
            // Validación de fechaPrestamo (sin cambios)
            if (!(nuevoPrestamoData.fechaPrestamo instanceof Timestamp)) {
                if (typeof nuevoPrestamoData.fechaPrestamo === 'string' && nuevoPrestamoData.fechaPrestamo) {
                    const dateParts = nuevoPrestamoData.fechaPrestamo.split('-');
                    const dateObject = new Date(Date.UTC(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])));
                    if (isNaN(dateObject.getTime())) throw new Error('Fecha de préstamo inválida.');
                    nuevoPrestamoData.fechaPrestamo = Timestamp.fromDate(dateObject);
                } else {
                    throw new Error("La fecha del préstamo es obligatoria y debe ser válida.");
                }
            }
            const cantidadCopias = Number(nuevoPrestamoData.cantidadCopiasPrestadas) || 0;
            if (cantidadCopias <= 0) throw new Error("La cantidad de copias debe ser mayor a cero.");

            await runTransaction(firestore, async (transaction) => {
                const estructuraExpedientesDocRef = doc(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION, estructuraId);
                const estructuraExpedientesDoc = await transaction.get(estructuraExpedientesDocRef);
                if (!estructuraExpedientesDoc.exists()) throw new Error("El documento de expedientes de la estructura no existe.");

                let currentLista = estructuraExpedientesDoc.data().listaExpedientes || [];
                let expedienteDataParaPrestamo = null;
                let expedienteFound = false;

                const updatedLista = currentLista.map(exp => {
                    if (exp.id === expedienteIdentificador || exp.nombre === expedienteIdentificador) {
                        expedienteFound = true;
                        expedienteDataParaPrestamo = exp; // Guardar el objeto expediente
                        const copiasDisponibles = exp.copiasCertificadas || 0;
                        if (copiasDisponibles < cantidadCopias) {
                            throw new Error(`No hay suficientes copias (${copiasDisponibles} disp., ${cantidadCopias} sol.).`);
                        }
                        return { ...exp, copiasCertificadas: copiasDisponibles - cantidadCopias, fechaActualizacion: Timestamp.now() };
                    }
                    return exp;
                });
                 if (!expedienteFound) throw new Error(`Expediente '${expedienteIdentificador}' no encontrado.`);


                transaction.update(estructuraExpedientesDocRef, { listaExpedientes: updatedLista });

                const prestamosColRef = collection(firestore, "Prestamos");
                const dataToSave = {
                    ...nuevoPrestamoData,
                    cantidadCopiasPrestadas: cantidadCopias,
                    expedienteId: expedienteIdentificador, // Guardar el 'nombre' o 'id' interno como identificador
                    expedienteNombre: expedienteDataParaPrestamo?.nombre || expedienteIdentificador, // Asegurar que tengamos el nombre
                    estructuraId,
                    estatusPrestamo: "Prestado",
                    fechaRegistroPrestamo: Timestamp.now(),
                };
                // Necesitamos generar una referencia para addDoc dentro de la transacción si usamos firestore >= v9
                const newPrestamoRef = doc(prestamosColRef); // Crea una referencia con un ID nuevo
                transaction.set(newPrestamoRef, dataToSave); // Usa transaction.set con la nueva referencia
            });

            closeAddPrestamoModal();
            return true;
        } catch (err) {
            console.error("Error en la transacción de préstamo (new model):", err);
            throw new Error(err.message || "No se pudo registrar el préstamo.");
        } finally {
            setIsSavingPrestamo(false);
        }
    };

    return {
        isAddPrestamoModalOpen,
        isSavingPrestamo,
        isProcessingEntrega,
        openAddPrestamoModal,
        closeAddPrestamoModal,
        saveNuevoPrestamo,
        marcarPrestamoEntregado
    };
};