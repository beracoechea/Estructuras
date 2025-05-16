// src/hooks/useDashboardGeneralData.js
import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../config/firebase-config'; // Ajusta tu ruta
import { collection, getDocs } from 'firebase/firestore';

const ESTRUCTURA_EXPEDIENTES_COLLECTION = "EstructuraExpedientes";
const PREDEFINED_MONTHLY_NAMES_FOR_DASHBOARD = ["OC IMSS", "OC SAT", "CSF EMPRESA", "CSF RL", "COMP DE DOM", "SUA"];
const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const useDashboardGeneralData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Para expedientes mensuales
    const [aggregatedMonthlyEstatusData, setAggregatedMonthlyEstatusData] = useState([]);
    const [aggregatedMonthlyCompliance, setAggregatedMonthlyCompliance] = useState(
        MESES_NOMBRES.map(m => ({ name: m, Cumplimiento: 0, completados: 0, totalPosibles: 0 }))
    );
    const [totalExpMensualesAnalizados, setTotalExpMensualesAnalizados] = useState(0);
    const [totalEstructurasConExpMensuales, setTotalEstructurasConExpMensuales] = useState(0);

    // NUEVO: Para expedientes generales
    const [aggregatedGeneralEstatusData, setAggregatedGeneralEstatusData] = useState([]);
    const [totalGeneralExpedientesAnalizados, setTotalGeneralExpedientesAnalizados] = useState(0);

    const [availableYears, setAvailableYears] = useState([]);

    const processData = useCallback(async (selectedYear) => {
        setLoading(true);
        setError(null);
        try {
            const estructuraExpedientesSnap = await getDocs(collection(firestore, ESTRUCTURA_EXPEDIENTES_COLLECTION));
            
            if (estructuraExpedientesSnap.empty) {
                // Reset all states
                setAggregatedMonthlyEstatusData([]);
                setAggregatedMonthlyCompliance(MESES_NOMBRES.map(m => ({ name: m, Cumplimiento: 0, completados: 0, totalPosibles: 0 })));
                setAggregatedGeneralEstatusData([]);
                setAvailableYears([new Date().getFullYear()]);
                setTotalExpMensualesAnalizados(0);
                setTotalEstructurasConExpMensuales(0);
                setTotalGeneralExpedientesAnalizados(0);
                setLoading(false);
                return;
            }

            const monthlyEstatusCounts = {};
            const generalEstatusCounts = {}; // NUEVO
            const monthlyChecksCompleted = Array(12).fill(0);
            const monthlyChecksPossible = Array(12).fill(0);
            const yearsFound = new Set();
            let uniqueExpMensualesCount = 0;
            let uniqueGeneralExpCount = 0; // NUEVO
            let estructurasConDataCount = 0;

            estructuraExpedientesSnap.forEach(docSnap => {
                const data = docSnap.data();
                const listaExp = data.listaExpedientes || [];
                let estructuraParticipoParaMensuales = false;

                listaExp.forEach(exp => {
                    const estatus = exp.estatus || "No especificado";
                    if (exp.tipo === 'mensual' && PREDEFINED_MONTHLY_NAMES_FOR_DASHBOARD.includes(exp.nombre)) {
                        uniqueExpMensualesCount++;
                        estructuraParticipoParaMensuales = true;
                        monthlyEstatusCounts[estatus] = (monthlyEstatusCounts[estatus] || 0) + 1;

                        if (exp.checksMensuales) {
                            Object.keys(exp.checksMensuales).forEach(yearStr => yearsFound.add(parseInt(yearStr)));
                            const checksDelAno = exp.checksMensuales[String(selectedYear)] || Array(12).fill(false);
                            checksDelAno.forEach((check, monthIndex) => {
                                monthlyChecksPossible[monthIndex]++;
                                if (check === true) monthlyChecksCompleted[monthIndex]++;
                            });
                        } else {
                            monthlyChecksPossible.forEach((_, monthIndex) => monthlyChecksPossible[monthIndex]++);
                        }
                    } else if (!exp.tipo || exp.tipo === 'general') { // Procesar expedientes generales
                        uniqueGeneralExpCount++;
                        generalEstatusCounts[estatus] = (generalEstatusCounts[estatus] || 0) + 1;
                    }
                });
                if(estructuraParticipoParaMensuales) estructurasConDataCount++;
            });

            const monthlyEstatusChartData = Object.entries(monthlyEstatusCounts).map(([name, value]) => ({ name, value }));
            const generalEstatusChartData = Object.entries(generalEstatusCounts).map(([name, value]) => ({ name, value })); // NUEVO
            
            const monthlyComplianceChartData = MESES_NOMBRES.map((mes, index) => ({
                name: mes, Completados: monthlyChecksCompleted[index], Posibles: monthlyChecksPossible[index],
                Cumplimiento: monthlyChecksPossible[index] > 0 ? (monthlyChecksCompleted[index] / monthlyChecksPossible[index]) * 100 : 0,
            }));

            setAggregatedMonthlyEstatusData(monthlyEstatusChartData);
            setAggregatedGeneralEstatusData(generalEstatusChartData); // NUEVO
            setAggregatedMonthlyCompliance(monthlyComplianceChartData);
            setAvailableYears(yearsFound.size > 0 ? Array.from(yearsFound).sort((a, b) => b - a) : [new Date().getFullYear()]);
            setTotalExpMensualesAnalizados(uniqueExpMensualesCount);
            setTotalGeneralExpedientesAnalizados(uniqueGeneralExpCount); // NUEVO
            setTotalEstructurasConExpMensuales(estructurasConDataCount);

        } catch (err) {
            console.error("Error procesando datos para Dashboard General:", err);
            setError("No se pudieron cargar los datos del dashboard general.");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading, error,
        aggregatedMonthlyEstatusData, aggregatedMonthlyCompliance, totalExpMensualesAnalizados, totalEstructurasConExpMensuales,
        aggregatedGeneralEstatusData, totalGeneralExpedientesAnalizados, // Exportar nuevos datos
        availableYears, processData,
    };
};