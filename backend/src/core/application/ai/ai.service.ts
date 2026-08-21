import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { Vehicle } from '../../../infrastructure/database/mongoose/schemas/vehicle.schema';
import { Duty } from '../../../infrastructure/database/mongoose/schemas/duty.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI | null = null;

  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(Duty.name) private dutyModel: Model<Duty>,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY no configurado, la IA no funcionará.');
    }
  }

  async suggestVehicle(startTime: Date, endTime: Date) {
    if (!this.ai) {
      throw new Error('Servicio de IA no disponible (API Key faltante)');
    }

    // 1. Obtener estado del mundo
    const vehicles = await this.vehicleModel.find().lean();
    
    // Traer los duties que se crucen con el horario solicitado
    const conflictingDuties = await this.dutyModel.find({
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    }).lean();

    // 2. Preparar el contexto
    const context = {
      requestedTimeWindow: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      fleet: vehicles.map(v => ({ id: v._id.toString(), plate: v.plate })),
      currentDuties: conflictingDuties.map(d => ({
        id: d._id.toString(),
        vehicleId: d.vehicleId?.toString(),
        start: d.startTime.toISOString(),
        end: d.endTime.toISOString()
      }))
    };

    // 3. Prompt de Inteligencia Artificial (System + Context)
    const prompt = `
Eres un Agente Despachador para una empresa de transporte.
Tu objetivo es sugerir el mejor vehículo para un nuevo servicio (Duty) en la franja horaria solicitada.

Contexto actual de la flota y rutas asignadas (JSON):
${JSON.stringify(context, null, 2)}

Reglas:
1. No puedes sugerir un vehículo que ya tenga un Duty asignado (currentDuties) que se solape con el requestedTimeWindow.
2. Si todos los vehículos están ocupados, debes indicarlo devolviendo null en vehicleId.
3. Elige cualquier vehículo disponible al azar si hay varios, priorizando balancear la flota si tuvieras datos, pero simplemente elige uno válido.

Debes responder ÚNICAMENTE con un JSON válido usando esta estructura exacta (no agregues Markdown como \`\`\`json, solo el objeto JSON puro):
{
  "vehicleId": "id-del-vehiculo-elegido",
  "reason": "Explicación breve de por qué lo elegiste y validando que no tenga conflictos"
}
`;

    // Definir schema de validación para atrapar alucinaciones
    const SuggestionSchema = z.object({
      vehicleId: z.string().nullable(),
      reason: z.string()
    });

    this.logger.log('Iniciando razonamiento de IA para sugerencia de vehículo...');
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    let suggestion;
    
    try {
      const parsedJson = JSON.parse(rawText);
      // Validar estrictamente contra el schema
      suggestion = SuggestionSchema.parse(parsedJson);
    } catch (e: any) {
      this.logger.error('Error parseando o validando respuesta de IA', e);
      throw new Error('La IA devolvió un formato inválido o alucinó la respuesta');
    }

    // Extraer métricas de costos
    const usage = response.usageMetadata;
    
    return {
      suggestion,
      metrics: {
        promptTokens: usage?.promptTokenCount || 0,
        candidatesTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0
      }
    };
  }
}
