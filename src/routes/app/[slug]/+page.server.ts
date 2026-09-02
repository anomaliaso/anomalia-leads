import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { queueForBrand, lastScanForBrand } from '$lib/server/queue';
import { markLeadDone, markLeadIgnored } from '$lib/server/leads';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { brand } = await parent();

  const [leads, scan] = await Promise.all([
    queueForBrand(locals.supabase, brand.id),
    lastScanForBrand(locals.supabase, brand.id)
  ]);

  return { leads, scan };
};

/** Legge il lead solo se è del brand di chi chiede: l'id da solo non autorizza niente. */
async function ownedLead(locals: App.Locals, id: string) {
  const { data } = await locals.supabase
    .from('brand_news_items')
    .select('id, url, author_handle, author_platform, dm_target')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export const actions: Actions = {
  done: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const lead = await ownedLead(locals, id);
    if (!lead) return fail(404, { error: 'lead not found' });

    // `done_at` è ciò che `contactGate` guarda: da qui in poi quella persona è stata toccata.
    const { error } = await markLeadDone(adminClient(), id);
    if (error) return fail(500, { error: error.message });
    return { ok: true };
  },

  ignore: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id') ?? '');
    const lead = await ownedLead(locals, id);
    if (!lead) return fail(404, { error: 'lead not found' });

    const { error } = await markLeadIgnored(adminClient(), lead);
    if (error) return fail(500, { error: error.message });
    return { ok: true };
  }
};
