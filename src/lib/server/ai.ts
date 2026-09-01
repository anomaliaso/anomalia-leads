import { generateObject, jsonSchema } from 'ai';
import { env } from '$env/dynamic/private';

/**
 * L'unico punto che parla col modello.
 *
 * Il modello è una stringa `provider/model` che passa dall'AI Gateway: nessun SDK di provider
 * installato, e cambiarlo è una variabile d'ambiente invece di un refactor.
 */
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export async function aiObject<T>(opts: {
  schema: Record<string, unknown>;
  prompt: string;
  system?: string;
}): Promise<T | null> {
  try {
    const { object } = await generateObject({
      model: env.LEADS_MODEL || DEFAULT_MODEL,
      schema: jsonSchema<T>(opts.schema as never),
      system: opts.system,
      prompt: opts.prompt
    });
    return object;
  } catch (e) {
    // Un modello che non risponde non deve far cadere una scansione: il resto delle sorgenti
    // continua, e il giro successivo riprova.
    console.warn('[ai] fallita:', e instanceof Error ? e.message.slice(0, 200) : e);
    return null;
  }
}
