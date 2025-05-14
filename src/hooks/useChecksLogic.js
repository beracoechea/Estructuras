// src/hooks/useChecksLogic.js
import { useState, useEffect, useCallback } from 'react';
import {
    fetchChecksDataForYear,
    updateSingleMonthCheckData,
    initializeChecksForYear
} from '../services/firebaseChecksService';

export const useChecksLogic = (estructuraId) => {
    const [currentAnoChecks, setCurrentAnoChecks] = useState(new Date().getFullYear());
    const [checksDataForYear, setChecksDataForYear] = useState(null); // Array de {mesId, marcado, observacion}
    const [loadingChecks, setLoadingChecks] = useState(false);
    const [errorChecks, setErrorChecks] = useState(null);

    const loadChecksData = useCallback(async (anoToLoad) => {
        if (!estructuraId || !anoToLoad) {
            setChecksDataForYear(null); // Limpiar si no hay ID o año
            return;
        }
        setLoadingChecks(true);
        setErrorChecks(null);
        try {
            const data = await fetchChecksDataForYear(estructuraId, anoToLoad);
            setChecksDataForYear(data); // data es el array de registrosMeses o null
        } catch (err) {
            console.error("Error en useChecksLogic al cargar checks:", err);
            setErrorChecks(err.message || "Error cargando datos de control.");
            setChecksDataForYear(null);
        } finally {
            setLoadingChecks(false);
        }
    }, [estructuraId]);

    // Cargar datos cuando el año o el ID de la estructura cambien
    useEffect(() => {
        loadChecksData(currentAnoChecks);
    }, [currentAnoChecks, loadChecksData]);

    const handleAnoChange = useCallback((newAno) => {
        setCurrentAnoChecks(newAno); // Esto disparará el useEffect de arriba para recargar
    }, []);

    const handleUpdateMonthData = useCallback(async (ano, mesId, updatedMonthData) => {
        if (!estructuraId) {
            console.error("ID de estructura no disponible para actualizar check.");
            throw new Error("ID de estructura no disponible");
        }
        try {
            await updateSingleMonthCheckData(estructuraId, ano, mesId, updatedMonthData);
            // Para asegurar consistencia, recargamos los datos del año después de una actualización exitosa.
            // La UI en EstadosDeCuentaView hace una actualización optimista, pero esto sincroniza.
            await loadChecksData(ano); // Recargar para reflejar el estado guardado
        } catch (err) {
            console.error("Error en useChecksLogic al actualizar check:", err);
            throw err; // Re-lanzar para que el componente View pueda manejarlo si es necesario
        }
    }, [estructuraId, loadChecksData]);

    const handleInitializeYear = useCallback(async (anoToInit) => {
        if (!estructuraId) {
            console.error("ID de estructura no disponible para inicializar checks.");
            return;
        }
        setLoadingChecks(true);
        setErrorChecks(null);
        try {
            const initialData = await initializeChecksForYear(estructuraId, anoToInit);
            setChecksDataForYear(initialData); // Actualiza la UI con los datos recién inicializados
        } catch (err) {
            console.error("Error en useChecksLogic al inicializar checks:", err);
            setErrorChecks(err.message || "Error al inicializar control del año.");
        } finally {
            setLoadingChecks(false);
        }
    }, [estructuraId]);

    return {
        currentAnoChecks,
        checksDataForYear,
        loadingChecks,
        errorChecks,
        handleAnoChange,
        handleUpdateMonthData,
        handleInitializeYear,
    };
};