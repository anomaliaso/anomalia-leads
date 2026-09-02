import { generateObject, jsonSchema } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { env } from '$env/dynamic/private';

/**
 * L'unico punto che parla col modello.
 *
 * Passa da OpenRouter, che è compatibile con l'API di OpenAI: il modello è una stringa
 * `provider/model` e cambiarlo è una variabile d'ambiente invece di un refactor.
 *
 * La chiave si passa ESPLICITAMENTE. Gli SDK leggono `process.env`, che in SvelteKit non è dove
 * vivono le variabili — stanno in `$env/dynamic/private`. Lasciarlo cercare da solo produce un
 * "Unauthenticated" con la chiave giusta nel `.env`: un guasto che sembra una chiave sbagliata ed
 * è una chiave invisibile.
 */
const DEFAULT_MODEL = 'openai/gpt-5.6-luna';

const openrouter = createOpenAICompatible({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
  // Senza questo l'SDK non manda `response_format: json_schema` e ripiega su una modalità che il
  // provider rifiuta: l'errore che si vede è un generico "Provider returned error", mentre la
  // stessa richiesta fatta a mano funziona. Va dichiarato, non è dedotto dal baseURL.
  supportsStructuredOutputs: true,
  headers: {
    // OpenRouter attribuisce il traffico a questi due: senza, le chiamate restano anonime nel
    // cruscotto e non si capisce quale prodotto ha speso cosa.
    'HTTP-Referer': env.PUBLIC_APP_URL || 'https://dazero.co',
    'X-Title': 'anomalia-leads'
  }
});

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
  /** Il modello per QUESTO lavoro: giudicare quaranta conversazioni e scrivere una bozza non
   *  sono lo stesso compito, e non devono essere costretti allo stesso modello. */
  model?: string;
}): Promise<T | null> {
  try {
    const { object } = await generateObject({
      model: openrouter(opts.model || env.LEADS_MODEL || DEFAULT_MODEL),
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
