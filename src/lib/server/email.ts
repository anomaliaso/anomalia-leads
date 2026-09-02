import { env } from '$env/dynamic/private';

const FROM = 'Anomalia Leads <leads@anomalia.so>';

/** Un giro sull'API REST di Resend: non serve l'SDK per un POST con due campi. */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY non configurata');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM, to, subject, html })
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}
