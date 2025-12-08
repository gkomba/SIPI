"use client";

import React, { useEffect, useRef } from "react";
import { Activity, Clock, MapPin } from "lucide-react";
import { CircuitData } from "../types";
import { StatusBadge } from "./StatusBadge";

interface CircuitCardProps {
  data: CircuitData | null;
  loading: boolean;
  isOnline: boolean;
}

interface PosteStatus {
  id: number;
  status: "OK" | "ALERT" | "WARNING" | "OFFLINE";
}

export const CircuitCard: React.FC<CircuitCardProps> = ({ data, loading, isOnline }) => {
  /* ---------------------------------- *
   * 1. Parseia a string "Falha(s) Encontrada(s) no(s) zona(s): 2 3"  
   *    e devolve um array de postes com status.
   * ---------------------------------- */
  const parsePostesStatus = (info: string): PosteStatus[] => {
    const postes: PosteStatus[] = [
      { id: 1, status: "OK" },
      { id: 2, status: "OK" },
      { id: 3, status: "OK" },
      { id: 4, status: "OK" }
    ];

    if (info) {
      const match = info.match(/zona\(s\).*?:?\s*([\d\s]+)/i);
      if (match) {
        const failedZones = match[1].trim().split(/\s+/).map(Number);
        failedZones.forEach((zoneId) => {
          const poste = postes.find((p) => p.id === zoneId);
          if (poste) poste.status = "ALERT";
        });
      }
    }

    return postes;
  };

  /* -------------------- 2. Cálculos -------------------- */
  const postes = data ? parsePostesStatus(data.info) : [];
  const alertIds = postes.filter((p) => p.status === "ALERT").map((p) => p.id); // [1, 2]

  /* -------------------- 3. Envio de alerta -------------------- */
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data) return;

    const lastUpdate = data.time; // "2025-06-28 03:34:20"
    const postesStr  = alertIds.length ? alertIds.join(" ") : "GK";
    if (lastSentRef.current === lastUpdate) return; // já enviou para este timestamp

    lastSentRef.current = lastUpdate;

    (async () => {
      try {
        const res = await fetch(`${process.env.API_URL}/alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              postes: postesStr,
              lastUpdate
            }
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log("Alerta enviado com sucesso");
      } catch (err) {
        console.error("Erro ao enviar alerta:", err);
      }
    })();
  }, [alertIds, data]);

  /* -------------------- 4. UI de carregamento -------------------- */
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Circuito</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  /* -------------------- 5. Status geral do sistema -------------------- */
  const systemStatus: "OK" | "ALERT" = alertIds.length ? "ALERT" : "OK";

  /* -------------------- 6. Renderização principal -------------------- */
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Circuito</h2>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={isOnline ? "online" : "offline"} size="sm" />
          <StatusBadge status={systemStatus} />
        </div>
      </div>

      {data ? (
        <div className="space-y-6">
          {/* ---------- Status individual dos postes ---------- */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Status dos Postes</h3>
            <div className="space-y-2">
              {postes.map((poste) => (
                <div
                  key={poste.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-l-4 transition-colors
                    ${poste.status === "OK"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                      : "bg-red-50 dark:bg-red-900/20 border-red-500"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${poste.status === "OK"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"}
                      `}
                    >
                      <MapPin
                        className={`
                          w-4 h-4
                          ${poste.status === "OK"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"}
                        `}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Poste {poste.id}</p>
                      <p
                        className={`
                          text-sm
                          ${poste.status === "OK"
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"}
                        `}
                      >
                        {poste.status === "OK" ? "Funcionando normalmente" : "Falha detectada"}
                      </p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${poste.status === "OK" ? "bg-green-500" : "bg-red-500"}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Informações gerais ---------- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</h3>
              <p className="text-gray-900 dark:text-gray-100 capitalize">{data.status === "on" ? "Ativo" : "Inativo"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Última Atualização</h3>
              <div className="flex items-center gap-1 text-gray-900 dark:text-gray-100">
                <Clock size={14} />
                <span className="text-sm">{data.time}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
      )}
    </div>
  );
};
