# Henson Smith domain migration — prepared 24 October 2026

Primary domain: https://hensonsmith.com/
Site5 domain created and confirmed with document root /home2/stephenm/public_html/henson-smith.
Site5 verified shared IP: 162.215.249.113.
123 Reg Linktree forwarding removed. Apex A record updated to the Site5 address; www CNAME remains hensonsmith.com.
Cloudflare Free zone created. Imported A, www CNAME and existing _dmarc TXT; _domainconnect remains DNS-only. Assigned nameservers: leah.ns.cloudflare.com and leland.ns.cloudflare.com. Registrar nameserver change submitted. DNSSEC was already off.

Cloudflare Origin certificate installed in Site5 and Full (Strict) encryption enabled. HTTPS verified HTTP 200. Canonical URL, social sharing metadata, structured data, robots and sitemap deployed for hensonsmith.com. Active .htaccess redirects the portfolio alias and www to the primary domain. Verified old URL resolves to https://hensonsmith.com/. Google Search Console domain property verified using a Cloudflare TXT record; sitemap submitted successfully, status Success with one discovered page on 24 October 2026. Do not remove the Google verification TXT record.

The GitHub deployment FTP account uploads to /home2/stephenm/stephenmusson.com/public_html, which is not the primary website's public_html. The user manually moved the artist folder to /home2/stephenm/public_html. Future automatic deployments need their FTPS account directory corrected; do not assume a green workflow updates the public website.
