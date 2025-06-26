import { tool } from "ai";
import { z } from "zod";

export const fetchAllSystemData = (baseUrl: string) => {
  return {
    get_system_data: tool({
      description: "Busca todos os dados do sistema de iluminação inteligente ao usuário solicitar análise, status ou dados dos postes",
      parameters: z.object({}),
      execute: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/system-data`);

          if (!response.ok) {
            throw new Error(`Erro ao consultar /api/system-data: ${response.status}`);
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error("Erro na tool get_system_data:", error);
          return {
            error: "Não foi possível buscar os dados do sistema no momento.",
          };
        }
      }
    })
  };
};
