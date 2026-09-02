import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { proposeSources, saveSources } from '$lib/server/seed';
import { scanBrand, type Brand } from '$lib/server/scan';
import { createBrandSlug } from '$lib/brand-slug';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login?next=/app/new');

    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const about = String(form.get('about') ?? '').trim();
    const siteUrl = String(form.get('site_url') ?? '').trim();

    if (!name || about.length < 20) {
      return fail(400, {
        error: 'We need a name and two real lines about what you sell: that is where the sources come from.',
        name,
        about
      });
    }

    const admin = adminClient();

    // Le sorgenti PRIMA del brand: se il modello non ne trova, non resta niente in database.
    const proposed = await proposeSources(about);
    if (!proposed.length) {
      return fail(502, {
        error: 'I could not work out any sources. Try again with a more concrete description.',
        name,
        about
      });
    }

    const { data: brand, error } = await admin
      .from('brands')
      .insert({
        owner_id: locals.user.id,
        name,
        slug: createBrandSlug(name),
        about,
        site_url: siteUrl || null
      })
      .select('id, slug, name, about, site_url, plan')
      .single();

    if (error || !brand) return fail(500, { error: error?.message ?? 'could not create the brand', name, about });

    await saveSources(admin, brand.id, proposed);

    // Prima scansione subito: il valore si vede adesso, non al prossimo cron.
    await scanBrand(admin, brand as Brand).catch((e) => {
      console.warn('[nuovo brand] prima scansione:', e instanceof Error ? e.message : e);
    });

    redirect(303, `/app/${brand.slug}`);
  }
};
