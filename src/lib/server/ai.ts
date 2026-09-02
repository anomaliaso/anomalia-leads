import { generateObject, jsonSchema, createGateway } from 'ai';
import { env } from '$env/dynamic/private';

/**
 * L'unico punto che parla col modello.
 *
 * Il modello è una stringa `provider/model` che passa dall'AI Gateway: nessun SDK di provider
 * installato, e cambiarlo è una variabile d'ambiente invece di un refactor.
 *
 * La chiave si passa ESPLICITAMENTE. L'SDK di suo legge `process.env.AI_GATEWAY_API_KEY`, che in
 * SvelteKit non è dove vivono le variabili: stanno in `$env/dynamic/private`. Lasciarlo cercare da
 * solo produce un "Unauthenticated request to AI Gateway" con la chiave giusta nel `.env` —
 * un'ora di diagnosi per un guasto che non è una chiave sbagliata ma una chiave invisibile.
 */
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

/**
 * In structured output OpenAI rifiuta ogni oggetto che non dichiari `additionalProperties: false`.
 *
 * Si applica qui e non negli schemi perché è una regola DI QUESTO provider: `leads-core` descrive
 * la forma del risultato e non deve sapere chi la leggerà. Cambiando modello, questa riga se ne va
 * da sola.
 */
function strict<T>(node: T): T {
  if (Array.isArray(node)) return node.map(strict) as T;
  if (!node || typeof node !== 'object') return node;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) out[k] = strict(v);
  if (out.type === 'object') out.additionalProperties = false;
  return out as T;
}

export async function aiObject<T>(opts: {
  schema: Record<string, unknown>;
  prompt: string;
  system?: string;
}): Promise<T | null> {
  try {
    const { object } = await generateObject({
      model: gateway(env.LEADS_MODEL || DEFAULT_MODEL),
      schema: jsonSchema<T>(strict(opts.schema) as never),
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
