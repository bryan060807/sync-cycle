import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendPartnerInviteEmail(
  toEmail: string,
  inviterName: string,
  inviteLink: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    await client.emails.send({
      from: fromEmail || 'SyncCycle <noreply@resend.dev>',
      to: toEmail,
      subject: `${inviterName} invited you to SyncCycle`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2dd4bf; font-size: 28px; margin: 0;">SyncCycle</h1>
            <p style="color: #666; margin-top: 5px;">Couples Wellness & Productivity</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f0fdfa 0%, #fef3f2 100%); padding: 30px; border-radius: 16px; margin-bottom: 20px;">
            <h2 style="color: #334155; margin-top: 0;">You've been invited!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName}</strong> wants to connect with you on SyncCycle - a supportive space for couples to manage wellness, goals, and finances together.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: #2dd4bf; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center;">
            If the button doesn't work, copy and paste this link: <br>
            <a href="${inviteLink}" style="color: #2dd4bf;">${inviteLink}</a>
          </p>
        </div>
      `
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send invite email:', error);
    return false;
  }
}

export async function sendAlertEmail(
  toEmail: string,
  fromName: string,
  alertType: string,
  message?: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();

    const alertLabels: Record<string, string> = {
      triggered: "Triggered Alert",
      safe_word: "Safe Word Alert",
      overwhelmed: "Overwhelmed Alert",
    };
    const label = alertLabels[alertType] || "Partner Alert";

    await client.emails.send({
      from: fromEmail || 'SyncCycle <noreply@resend.dev>',
      to: toEmail,
      subject: `${fromName} sent a ${label} on SyncCycle`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2dd4bf; font-size: 28px; margin: 0;">SyncCycle</h1>
            <p style="color: #666; margin-top: 5px;">Partner Alert</p>
          </div>
          <div style="background: linear-gradient(135deg, #fef3f2 0%, #fff7ed 100%); padding: 30px; border-radius: 16px; margin-bottom: 20px;">
            <h2 style="color: #334155; margin-top: 0;">${label}</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              <strong>${fromName}</strong> has sent you an alert.
            </p>
            ${message ? `<p style="color: #475569; font-size: 16px; line-height: 1.6; font-style: italic;">"${message}"</p>` : ''}
          </div>
          <p style="color: #94a3b8; font-size: 14px; text-align: center;">
            Log in to SyncCycle to acknowledge this alert and check on your partner.
          </p>
        </div>
      `
    });

    return true;
  } catch (error) {
    console.error('Failed to send alert email:', error);
    return false;
  }
}
