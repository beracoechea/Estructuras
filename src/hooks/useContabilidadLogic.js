// src/hooks/useContabilidadLogic.js
import { useState, useCallback, useEffect } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta esta ruta si es necesario
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

const ESTRUCTURA_ITEMS_COLLECTION = "EstructuraExpedientes";

const PREDEFINED_CONTABILIDAD_ITEMS_CONFIG = [
    // Mensuales
    { nombre: "Registros auxiliares", frecuencia: "mensual" },
    { nombre: "Libro de mayor", frecuencia: "mensual" },
    { nombre: "Libro condensado", frecuencia: "mensual" },
    { nombre: "Pólizas de diario", frecuencia: "mensual" },
    { nombre: "Libros contables", frecuencia: "mensual" },
    { nombre: "Balanzas de comprobación", frecuencia: "mensual" },
    { nombre: "Estado de resultados/Balance general", frecuencia: "mensual" },
    { nombre: "Declaración mensual", frecuencia: "mensual" },
    { nombre: "Acuse de presentación de la declaración mensual", frecuencia: "mensual" },
    // Anuales (a año vencido)
    { nombre: "Declaración anual", frecuencia: "anual" },
    { nombre: "Acuse de presentación de la declaración anual", frecuencia: "anual" }
];

export const useContabilidadLogic = (estructuraId) => {
    const [contabilidadItems, setContabilidadItems] = useState([]);
    const [loadingContabilidad, setLoadingContabilidad] = useState(false);
    const [errorContabilidad, setErrorContabilidad] = useState(null);
    const [isCreatingDefaultContabilidad, setIsCreatingDefaultContabilidad] = useState(false);

    const fetchContabilidadData = useCallback(async () => {
        // ... (sin cambios)
        if (!estructuraId) {
            setContabilidadItems([]);
            return;
        }
        setLoadingContabilidad(true);
        setErrorContabilidad(null);
        try {
            const docRef = doc(firestore, ESTRUCTURA_ITEMS_COLLECTION, estructuraId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const allItems = docSnap.data().listaExpedientes || [];
                const contabilidad = allItems
                    .filter(item => item.tipo === 'contabilidad')
                    .map(item => ({ ...item, id: item.id || item.nombre }));
                contabilidad.sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
                setContabilidadItems(contabilidad);
            } else {
                setContabilidadItems([]);
            }
        } catch (err) {
            console.error("Error fetching contabilidad items:", err);
            setErrorContabilidad("No se pudieron cargar los registros de contabilidad.");
        } finally {
            setLoadingContabilidad(false);
        }
    }, [estructuraId]);

    const addDefaultContabilidadItemsToEstructura = async (targetEstructuraId) => {
        if (!targetEstructuraId) return { success: false, message: "ID de estructura no proporcionado." };
        setIsCreatingDefaultContabilidad(true);
        try {
            const docRef = doc(firestore, ESTRUCTURA_ITEMS_COLLECTION, targetEstructuraId);
            const docSnap = await getDoc(docRef);
            let currentListaItems = docSnap.exists() ? (docSnap.data().listaExpedientes || []) : [];
            
            const existingContabilidadNames = new Set(
                currentListaItems.filter(item => item.tipo === 'contabilidad').map(item => item.nombre)
            );
            
            let newItemsAdded = false;
            let maxOrdenContabilidad = -1;
            currentListaItems.filter(item => item.tipo === 'contabilidad').forEach(item => {
                if (item.orden !== undefined && item.orden > maxOrdenContabilidad) maxOrdenContabilidad = item.orden;
            });

            const currentYearForDefaults = new Date().getFullYear(); // Año para inicializar los checks

            PREDEFINED_CONTABILIDAD_ITEMS_CONFIG.forEach((itemConfig) => {
                if (!existingContabilidadNames.has(itemConfig.nombre)) {
                    maxOrdenContabilidad++;
                    const newItem = {
                        id: itemConfig.nombre,
                        nombre: itemConfig.nombre,
                        tipo: 'contabilidad',
                        frecuencia: itemConfig.frecuencia, 
                        descripcion: `Registro contable: ${itemConfig.nombre} (${itemConfig.frecuencia})`,
                        fechaRegistro: Timestamp.now(),
                        fechaActualizacion: Timestamp.now(),
                        orden: maxOrdenContabilidad,
                    };

                    // Inicializar campos de cumplimiento basados en frecuencia
                    if (itemConfig.frecuencia === 'mensual') {
                        newItem.cumplimientoMensual = { [currentYearForDefaults]: Array(12).fill(false) };
                    } else if (itemConfig.frecuencia === 'anual') {
                        newItem.cumplimientoAnual = { [currentYearForDefaults]: false };
                    }

                    currentListaItems.push(newItem);
                    newItemsAdded = true;
                }
            });

            currentListaItems.sort((a,b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));

            if (newItemsAdded || !docSnap.exists()) {
                await setDoc(docRef, { estructuraId: targetEstructuraId, listaExpedientes: currentListaItems }, { merge: true });
                return { success: true, message: `Registros de contabilidad predeterminados procesados.` };
            } else {
                return { success: true, message: "Todos los registros de contabilidad predeterminados ya existen." };
            }
        } catch (err) {
            console.error("Error al añadir registros de contabilidad predeterminados:", err);
            return { success: false, message: `Error: ${err.message}` };
        } finally {
            setIsCreatingDefaultContabilidad(false);
        }
    };
    
    // addNewCustomContabilidadItem y handleUpdateContabilidadItem permanecen igual por ahora,
    // pero handleUpdateContabilidadItem será quien reciba los datos de cumplimientoMensual/Anual actualizados.
    // ... (resto de las funciones addNewCustomContabilidadItem, handleUpdateContabilidadItem) ...
        const addNewCustomContabilidadItem = async (targetEstructuraId, nuevoItemData) => {
            if (!targetEstructuraId || !nuevoItemData || !nuevoItemData.nombre) {
                return { success: false, message: "Datos incompletos para el nuevo registro contable." };
            }
            try {
                const docRef = doc(firestore, ESTRUCTURA_ITEMS_COLLECTION, targetEstructuraId);
                const docSnap = await getDoc(docRef);
                let currentListaItems = docSnap.exists() ? (docSnap.data().listaExpedientes || []) : [];
                
                if (currentListaItems.some(item => item.nombre === nuevoItemData.nombre && item.tipo === 'contabilidad')) {
                    return { success: false, message: `El registro contable "${nuevoItemData.nombre}" ya existe.` };
                }
                
                let maxOrden = -1; 
                currentListaItems.forEach(item => {
                    if (item.orden !== undefined && item.orden > maxOrden) maxOrden = item.orden;
                });

                const currentYearForDefaults = new Date().getFullYear();
                const itemCompleto = {
                    ...nuevoItemData, 
                    id: nuevoItemData.id || nuevoItemData.nombre,
                    tipo: 'contabilidad', 
                    fechaRegistro: Timestamp.now(),
                    fechaActualizacion: Timestamp.now(),
                    orden: maxOrden + 1,
                };

                // Si se añade un item custom, también podría necesitar inicializar su cumplimiento
                // Esto dependerá de si el modal de añadir custom permite definir frecuencia
                if (itemCompleto.frecuencia === 'mensual' && !itemCompleto.cumplimientoMensual) {
                    itemCompleto.cumplimientoMensual = { [currentYearForDefaults]: Array(12).fill(false) };
                } else if (itemCompleto.frecuencia === 'anual' && !itemCompleto.cumplimientoAnual) {
                    itemCompleto.cumplimientoAnual = { [currentYearForDefaults]: false };
                }


                currentListaItems.push(itemCompleto);
                currentListaItems.sort((a,b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
    
                await setDoc(docRef, { estructuraId: targetEstructuraId, listaExpedientes: currentListaItems }, { merge: true });
                return { success: true, message: `Registro contable "${nuevoItemData.nombre}" añadido.` };
            } catch (err) {
                console.error("Error añadiendo nuevo registro contable personalizado:", err);
                return { success: false, message: `Error: ${err.message}` };
            }
        };
    
        const handleUpdateContabilidadItem = async (itemIdToUpdate, dataToUpdate) => {
            if (!estructuraId || !itemIdToUpdate) {
                return { success: false, message: "Faltan IDs para actualizar el registro contable." };
            }
    
            const previousState = JSON.parse(JSON.stringify(contabilidadItems));
    
            setContabilidadItems(currentItems => {
                return currentItems.map(item => {
                    if (item.id === itemIdToUpdate || item.nombre === itemIdToUpdate) { 
                        return { ...item, ...dataToUpdate, fechaActualizacion: Timestamp.now() };
                    }
                    return item;
                });
            });
    
            try {
                const docRef = doc(firestore, ESTRUCTURA_ITEMS_COLLECTION, estructuraId);
                const docSnap = await getDoc(docRef);
    
                if (!docSnap.exists()) {
                    throw new Error("Documento de la estructura no encontrado para actualizar registros contables.");
                }
    
                let listaGlobalActual = docSnap.data().listaExpedientes || [];
                let itemEncontradoEnFirestore = false;
    
                const listaGlobalActualizada = listaGlobalActual.map(item => {
                    if ((item.id === itemIdToUpdate || item.nombre === itemIdToUpdate) && item.tipo === 'contabilidad') {
                        itemEncontradoEnFirestore = true;
                        let datosParaFirestore = { ...dataToUpdate };
                        
                        if (datosParaFirestore.fecha && typeof datosParaFirestore.fecha === 'string' && datosParaFirestore.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const dp = datosParaFirestore.fecha.split('-');
                            datosParaFirestore.fecha = Timestamp.fromDate(new Date(Date.UTC(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]))));
                        } else if (datosParaFirestore.fecha === '') {
                            datosParaFirestore.fecha = null;
                        }
                        
                        return { ...item, ...datosParaFirestore, fechaActualizacion: Timestamp.now() };
                    }
                    return item;
                });
    
                if (!itemEncontradoEnFirestore) {
                    // Si no se encontró, revierte el estado optimista y lanza error
                    setContabilidadItems(previousState);
                    throw new Error(`Registro contable "${itemIdToUpdate}" no encontrado en Firestore.`);
                }
    
                await updateDoc(docRef, { listaExpedientes: listaGlobalActualizada });
                return { success: true, message: "Registro contable actualizado." };
    
            } catch (err) {
                console.error("Error actualizando registro contable en Firestore:", err);
                setContabilidadItems(previousState); 
                return { success: false, message: `Error al actualizar: ${err.message}. Se revirtieron los cambios visuales.` };
            }
        };
    
    useEffect(() => {
        if (estructuraId) {
            fetchContabilidadData();
        } else {
            setContabilidadItems([]); 
        }
    }, [estructuraId, fetchContabilidadData]);

    return {
        contabilidadItems,
        loadingContabilidad,
        errorContabilidad,
        isCreatingDefaultContabilidad,
        fetchContabilidadData,
        addDefaultContabilidadItemsToEstructura,
        handleUpdateContabilidadItem,
        addNewCustomContabilidadItem
    };
};