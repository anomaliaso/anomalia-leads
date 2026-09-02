import type { RequestHandler } from './$types';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { adminClient } from '$lib/server/supabase';
import { brandFromRequest } from '$lib/server/apiAuth';
import { queueForBrand, lastScanForBrand } from '$lib/server/queue';
import { findLeadForBrand, markLeadDone, markLeadIgnored } from '$lib/server/leads';
import { SOURCE_KINDS, addSource, listSources, ownedSource, removeSource, setSourceActive } from '$lib/server/sources';

/**
 * Stessa API REST, vista da un client MCP: ogni tool è un wrapper sottile sugli stessi helper di
 * `$lib/server/*` — nessuna logica di prodotto vive qui, solo la traduzione da tool call a
 * chiamata di dominio. Un `McpServer` per richiesta (modalità stateless): niente sessione da
 * tenere in memoria fra una chiamata e l'altra.
 */
function buildServer(brand: { id: string }) {
  const server = new McpServer({ name: 'anomalia-leads', version: '1.0.0' });
  const admin = adminClient();
  const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
  const fail = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

  server.registerTool(
    'get_queue',
    { title: 'Get queue', description: "Le bozze pronte da incollare, ordinate per intenzione d'acquisto." },
    async () => text(await queueForBrand(admin, brand.id))
  );

  server.registerTool(
    'get_status',
    { title: 'Get scan status', description: "Esito dell'ultima scansione: distingue \"niente oggi\" da \"sorgenti rotte\"." },
    async () => text(await lastScanForBrand(admin, brand.id))
  );

  server.registerTool(
    'update_lead',
    {
      title: 'Mark a lead done or ignored',
      description: '"done" segna il commento come postato; "ignore" lo scarta e non ripropone mai più quella persona.',
      inputSchema: { id: z.string().describe('id del lead'), action: z.enum(['done', 'ignore']) }
    },
    async ({ id, action }) => {
      const lead = await findLeadForBrand(admin, brand.id, id);
      if (!lead) return fail('lead not found');
      const { error } = action === 'done' ? await markLeadDone(admin, lead.id) : await markLeadIgnored(admin, lead);
      return error ? fail(error.message) : text({ ok: true });
    }
  );

  server.registerTool('list_sources', { title: 'List sources', description: 'Le sorgenti guardate per questo brand.' }, async () =>
    text(await listSources(admin, brand.id))
  );

  server.registerTool(
    'add_source',
    {
      title: 'Add a source',
      description: 'Aggiunge (o riattiva se già presente) una sorgente da guardare.',
      inputSchema: { kind: z.enum(SOURCE_KINDS), value: z.string().describe('subreddit, community, o parole chiave') }
    },
    async ({ kind, value }) => {
      try {
        return text(await addSource(admin, brand.id, kind, value));
      } catch (err) {
        return fail((err as Error).message);
      }
    }
  );

  server.registerTool(
    'set_source_active',
    {
      title: 'Pause or resume a source',
      description: 'Mette in pausa o riprende una sorgente.',
      inputSchema: { id: z.string(), active: z.boolean() }
    },
    async ({ id, active }) => {
      if (!(await ownedSource(admin, brand.id, id))) return fail('source not found');
      await setSourceActive(admin, id, active);
      return text({ ok: true });
    }
  );

  server.registerTool(
    'remove_source',
    { title: 'Remove a source', description: 'Rimuove una sorgente.', inputSchema: { id: z.string() } },
    async ({ id }) => {
      if (!(await ownedSource(admin, brand.id, id))) return fail('source not found');
      await removeSource(admin, id);
      return text({ ok: true });
    }
  );

  return server;
}

const handle: RequestHandler = async ({ request }) => {
  const brand = await brandFromRequest(request);
  // JSON semplice invece di SSE: questi tool sono richieste/risposte singole, nessuno streaming da gestire.
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await buildServer(brand).connect(transport);
  return transport.handleRequest(request);
};

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
