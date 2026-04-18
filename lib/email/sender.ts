import { Resend } from 'resend';
import { confirmationEmailTemplate, alertEmailTemplate } from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.ALERT_EMAIL_FROM || 'alerts@cve-lucid.xyz';

export async function sendConfirmationEmail(email: string, confirmUrl: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Confirm your CVE Lucid Alerts',
      html: confirmationEmailTemplate(confirmUrl),
    });
    return true;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return false;
  }
}

export async function sendAlertEmail(email: string, cves: any[], product: string, unsubscribeUrl: string) {
  try {
    const criticalCount = cves.filter(c => c.severity === 'CRITICAL').length;
    const highCount = cves.filter(c => c.severity === 'HIGH').length;
    
    let subject = `${cves.length} new CVEs affecting ${product}`;
    if (criticalCount > 0 || highCount > 0) {
      subject += ` (${criticalCount} Critical, ${highCount} High)`;
    }

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: alertEmailTemplate(cves, product, unsubscribeUrl),
    });
    return true;
  } catch (error) {
    console.error(`Failed to send alert email to ${email}:`, error);
    return false;
  }
}
