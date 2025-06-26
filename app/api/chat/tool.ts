import { tool } from "ai";
import { z } from "zod";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const fetchAllSystemData = () => {
  return {
    fetchAllData: tool({
      name: "get_system_data",
      description: "Busca todos os dados do sistema de iluminação inteligente do endpoint /api/system-data",
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
