// src/pages/dashboard/DashboardGeneralView.jsx
import React, { useState, useEffect } from 'react';
import { useDashboardGeneralData } from '../../../hooks/useDashboardGeneralData'; // Ajusta la ruta
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './DashboardGeneralView.css';

const PIE_CHART_COLORS_GENERAL = ['#6A1B9A', '#AD1457', '#1E88E5', '#00ACC1', '#43A047', '#FDD835', '#FB8C00'];
const BAR_CHART_COLOR_CUMPLIMIENTO = '#82ca9d';

const CustomTooltipBar = ({ active, payload, label }) => { /* ... (sin cambios) ... */ 
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label}`}</p>
                <p className="desc">{`Cumplimiento: ${payload[0].value.toFixed(1)}%`}</p>
                {data.Completados !== undefined && data.Posibles !== undefined && (
                    <p className="intro">{`Checks: ${data.Completados} de ${data.Posibles}`}</p>
                )}
            </div>
        );
    }
    return null;
};

export const DashboardGeneralView = ({ userInfo }) => {
    const {
        loading, error,
        aggregatedMonthlyEstatusData, aggregatedMonthlyCompliance, totalExpMensualesAnalizados, totalEstructurasConExpMensuales,
        aggregatedGeneralEstatusData, totalGeneralExpedientesAnalizados, // NUEVOS datos del hook
        availableYears, processData,
    } = useDashboardGeneralData();

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        processData(selectedYear);
    }, [processData, selectedYear]);
    
    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    if (loading) return <div className="status-container"><p>Cargando Dashboard General...</p></div>;
    if (error) return <div className="status-container error"><p>{error} <button onClick={() => processData(selectedYear)}>Reintentar</button></p></div>;

    return (
        <div className="dashboard-general-view">
            <div className="dashboard-header">
                <h1>Dashboard General de Cumplimiento y Estatus</h1>
                {/* <p className="subtitle">
                    Análisis global de expedientes para {totalEstructurasConExpMensuales} estructura(s).
                </p> */}
            </div>

            {/* Sección para Expedientes Generales */}
            <div className="dashboard-section">
                <h3>Distribución Global de Estatus (Expedientes Generales)</h3>
                <p className="section-subtitle">Total de {totalGeneralExpedientesAnalizados} expedientes generales analizados.</p>
                {aggregatedGeneralEstatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={aggregatedGeneralEstatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={110}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {aggregatedGeneralEstatusData.map((entry, index) => (
                                    <Cell key={`cell-general-estatus-${index}`} fill={PIE_CHART_COLORS_GENERAL[index % PIE_CHART_COLORS_GENERAL.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} expedientes`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="no-data-chart">No hay datos de estatus para expedientes generales.</p>
                )}
            </div>
          

            <div className="dashboard-section">
                <h3>Cumplimiento Mensual Global (Exp. Mensuales Clave)</h3>
                <div className="year-selector-dashboard">
                    <label htmlFor="year-select-global-dashboard">Seleccionar Año: </label>
                    <select
                        id="year-select-global-dashboard"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        disabled={availableYears.length === 0}
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {aggregatedMonthlyCompliance.some(m => m.Posibles > 0) ? ( // Verifica si hay datos para graficar
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={aggregatedMonthlyCompliance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} unit="%" label={{ value: 'Cumplimiento Global', angle: -90, position: 'insideLeft' }}/>
                            <Tooltip content={<CustomTooltipBar />} />
                            <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }} />
                            <Bar dataKey="Cumplimiento" fill={BAR_CHART_COLOR_CUMPLIMIENTO} name="Cumplimiento Mensual Global (%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="no-data-chart">No hay datos de cumplimiento mensual para el año {selectedYear}.</p>
                )}
            </div>
        </div>
    );
};