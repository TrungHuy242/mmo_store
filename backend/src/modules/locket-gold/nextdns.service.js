import axios from 'axios';

const NEXTDNS_API_BASE = 'https://api.nextdns.io';

class NextDnsService {
  /**
   * Get today's profile name for Locket Gold.
   * We reuse the same profile for all activations on the same day.
   */
  getProfileName() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `LocketVIP-${today}`;
  }

  /**
   * Get the NextDNS API key from environment or DB config.
   * Falls back to empty string (will cause DNS features to be skipped).
   */
  getApiKey() {
    // Try env var first
    if (process.env.NEXTDNS_API_KEY) return process.env.NEXTDNS_API_KEY;
    // Could also load from DB Setting model if needed
    return '';
  }

  /**
   * List existing profiles to find today's LocketVIP profile.
   * @returns {Promise<{id: string, name: string}|null>}
   */
  async findExistingProfile(apiKey) {
    if (!apiKey) return null;
    try {
      const res = await axios.get(`${NEXTDNS_API_BASE}/profiles`, {
        headers: { 'X-Api-Key': apiKey },
      });
      const profiles = res.data?.data || [];
      const target = profiles.find((p) => p.name === this.getProfileName());
      return target || null;
    } catch (err) {
      console.error('[NextDNS] findExistingProfile error:', err.message);
      return null;
    }
  }

  /**
   * Create a new daily LocketVIP profile.
   * @returns {Promise<{id: string, name: string}>}
   */
  async createProfile(apiKey) {
    if (!apiKey) throw new Error('NextDNS API key not configured');
    const name = this.getProfileName();
    const res = await axios.post(
      `${NEXTDNS_API_BASE}/profiles`,
      { name },
      { headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' } }
    );
    return { id: res.data?.data?.id, name };
  }

  /**
   * Block revenuecat.com and subdomains on a profile.
   * @param {string} profileId
   * @param {string} apiKey
   */
  async blockRevenueCat(profileId, apiKey) {
    if (!apiKey) return;
    try {
      await axios.post(
        `${NEXTDNS_API_BASE}/profiles/${profileId}/denylist`,
        {
          data: [
            { type: 'domain', value: 'revenuecat.com' },
            { type: 'domain', value: 'api.revenuecat.com' },
            { type: 'domain', value: 'www.revenuecat.com' },
          ],
        },
        { headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.error('[NextDNS] blockRevenueCat error:', err.message);
    }
  }

  /**
   * Create or reuse today's NextDNS profile and block RevenueCat.
   * @returns {Promise<{profileId: string, profileUrl: string}|null>}
   */
  async createDailyProfile() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('[NextDNS] NEXTDNS_API_KEY not set — skipping DNS profile creation');
      return null;
    }

    // Check if today's profile already exists
    let profile = await this.findExistingProfile(apiKey);

    if (!profile) {
      console.log(`[NextDNS] Creating new profile: ${this.getProfileName()}`);
      profile = await this.createProfile(apiKey);
    } else {
      console.log(`[NextDNS] Reusing existing profile: ${profile.name} (${profile.id})`);
    }

    // Always ensure RevenueCat is blocked
    await this.blockRevenueCat(profile.id, apiKey);

    const profileUrl = `https://apple.nextdns.io/?profile=${profile.id}`;
    return { profileId: profile.id, profileUrl };
  }

  /**
   * Returns step-by-step NextDNS setup instructions in the user's language.
   * @param {'vi'|'en'} lang
   */
  getSetupInstructions(lang = 'vi') {
    const t = {
      vi: {
        title: 'Kích hoạt thành công!',
        subtitle:
          'Để Locket Gold không bị thu hồi, bạn cần cài đặt DNS bảo vệ trong 24h. Làm theo hướng dẫn bên dưới:',
        iosTitle: 'iOS (iPhone / iPad)',
        iosSteps: [
          'Nhấn vào link DNS bên dưới',
          'Nhấn "Allow" nếu được hỏi',
          'Safari sẽ mở trang cài đặt Profile — nhấn "Install"',
          'Nhập mật khẩu iPhone → nhấn "Install" → "Done"',
          'Vào Settings → Wi-Fi → nhấn (i) → DNS → chọn "Configure DNS" → "Automatic"',
          'Đảm bảo DNS server là: `45.90.28.0` và `45.90.30.0`',
        ],
        androidTitle: 'Android',
        androidSteps: [
          'Vào Settings → Network & Internet (hoặc Connections)',
          'Chọn "Private DNS"',
          'Chọn "Private DNS provider hostname"',
          'Nhập: `{profileId}.dns.nextdns.io`',
          'Nhấn Save',
        ],
        note: 'Nếu Locket Gold bị mất sau 24h–30h, chỉ cần cài lại DNS profile (link bên dưới).',
        dnsLink: 'Link DNS cài đặt:',
        autoRenew:
          'DNS profile tự động gia hạn mỗi ngày — bạn không cần làm lại.',
      },
      en: {
        title: 'Activation successful!',
        subtitle:
          'To prevent Locket Gold from being revoked, install the protection DNS within 24h:',
        iosTitle: 'iOS (iPhone / iPad)',
        iosSteps: [
          'Tap the DNS link below',
          'Tap "Allow" if prompted',
          'Safari will open the Profile install page — tap "Install"',
          'Enter your iPhone passcode → tap "Install" → "Done"',
          'Go to Settings → Wi-Fi → tap (i) → DNS → "Configure DNS" → "Automatic"',
          'Ensure DNS servers are: `45.90.28.0` and `45.90.30.0`',
        ],
        androidTitle: 'Android',
        androidSteps: [
          'Go to Settings → Network & Internet (or Connections)',
          'Select "Private DNS"',
          'Select "Private DNS provider hostname"',
          'Enter: `{profileId}.dns.nextdns.io`',
          'Tap Save',
        ],
        note: 'If Locket Gold disappears after 24–30h, reinstall the DNS profile.',
        dnsLink: 'DNS install link:',
        autoRenew: 'DNS profile auto-renews daily — no need to reinstall.',
      },
    };

    const txt = t[lang] || t.vi;

    let msg = `✅ <b>${txt.title}</b>\n\n${txt.subtitle}\n\n`;

    msg += `📱 <b>${txt.iosTitle}</b>\n`;
    txt.iosSteps.forEach((step, i) => {
      msg += `${i + 1}. ${step}\n`;
    });

    msg += `\n🤖 <b>${txt.androidTitle}</b>\n`;
    txt.androidSteps.forEach((step, i) => {
      msg += `${i + 1}. ${step.replace('{profileId}', '👉 profile-id')}\n`;
    });

    msg += `\nℹ️ ${txt.note}\n`;
    msg += `🔗 ${txt.dnsLink}\n`;

    return { msg, profileId: '{profileId}', autoRenew: txt.autoRenew };
  }
}

export default new NextDnsService();
