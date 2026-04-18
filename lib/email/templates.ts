export const confirmationEmailTemplate = (confirmUrl: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <h2>Confirm your CVE Lucid Alerts</h2>
  <p>You're almost there! Click the button below to confirm your subscription and start receiving security updates.</p>
  <p>
    <a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0369a1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Confirm Subscription
    </a>
  </p>
  <p style="font-size: 12px; color: #666;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    ${confirmUrl}
  </p>
  <p style="font-size: 12px; color: #666; margin-top: 24px;">
    You received this email because someone signed up for alerts on CVE Lucid. 
    If this wasn't you, you can safely ignore this email.
  </p>
</body>
</html>
`;

export const alertEmailTemplate = (cves: any[], product: string, unsubscribeUrl: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0369a1;">New Security Alerts for ${product}</h2>
  <p>We found ${cves.length} new vulnerability disclosure(s) matching your criteria in the last 24 hours.</p>
  
  <div style="margin: 24px 0;">
    ${cves.map(cve => `
      <div style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f6f8fa;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <strong style="font-family: monospace; font-size: 16px;">${cve.id}</strong>
          <span style="padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background-color: ${getSeverityColor(cve.severity)}; color: #fff;">
            ${cve.severity}
          </span>
        </div>
        <p style="font-size: 14px; margin: 8px 0;">${cve.description}</p>
        <a href="https://cve-lucid.vercel.app/?cve=${cve.id}" style="font-size: 12px; color: #0369a1; text-decoration: none; font-weight: bold;">
          View Technical Analysis &rarr;
        </a>
      </div>
    `).join('')}
  </div>

  <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 16px;">
    Manage your alerts: <a href="${unsubscribeUrl}">Unsubscribe</a>
  </p>
</body>
</html>
`;

function getSeverityColor(sev: string) {
  switch (sev) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#22c55e';
    default: return '#6b7280';
  }
}
