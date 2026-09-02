import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { proposeSources, saveSources } from '$lib/server/seed';
import { scanBrand, type Brand } from '$lib/server/scan';
import { createBrandSlug } from '$lib/brand-slug';
import { planFor } from '$lib/plans';

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

    // Più di un brand è la promessa di Agency, e va verificata prima di crearne un secondo. Il
    // piano si legge dai brand già esistenti: è il trigger del billing a tenerli allineati
    // all'abbonamento, quindi valgono tutti lo stesso.
    const { data: mine } = await admin.from('brands').select('plan').eq('owner_id', locals.user.id);
    const plan = planFor(mine?.[0]?.plan as string | undefined);
    if ((mine?.length ?? 0) >= 1 && plan.id !== 'agency') {
      return fail(403, {
        error: `The ${plan.name} plan covers one brand. Agency covers several — see Billing.`,
        name,
        about
      });
    }

    // Le sorgenti PRIMA del brand: se il modello non ne trova, non resta niente in database.
    const proposed = await proposeSources(about, plan.id);
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
      .select('id, owner_id, slug, name, about, site_url, plan')
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
