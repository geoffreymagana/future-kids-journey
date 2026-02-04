/**
 * Source detection utility for tracking where visitors are coming from
 * Detects from UTM parameters, referrer, and known social media patterns
 */

export type TrafficSource = 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'whatsapp' 
  | 'reddit' 
  | 'telegram' 
  | 'tiktok' 
  | 'linkedin' 
  | 'direct' 
  | 'email' 
  | 'organic' 
  | 'other';

export interface SourceDetectionResult {
  source: TrafficSource;
  medium?: string;
  campaign?: string;
}

/**
 * Detect traffic source from URL parameters and referrer
 */
export function detectTrafficSource(): SourceDetectionResult {
  if (typeof window === 'undefined') {
    return { source: 'direct' };
  }

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;

  // Check for UTM source parameter
  const utmSource = params.get('utm_source')?.toLowerCase();
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');

  if (utmSource) {
    return {
      source: normalizeSource(utmSource),
      medium: utmMedium || undefined,
      campaign: utmCampaign || undefined
    };
  }

  // Check for explicit source parameter
  const source = params.get('source')?.toLowerCase();
  if (source) {
    return {
      source: normalizeSource(source),
      medium: utmMedium || undefined,
      campaign: utmCampaign || undefined
    };
  }

  // Detect from referrer
  if (referrer) {
    const detectedSource = detectFromReferrer(referrer);
    if (detectedSource !== 'direct') {
      return {
        source: detectedSource,
        medium: 'referral'
      };
    }
  }

  // Default to direct/organic
  return { 
    source: 'organic',
    medium: 'direct'
  };
}

/**
 * Normalize source name to known platform
 */
function normalizeSource(source: string): TrafficSource {
  const normalized = source.toLowerCase().trim();

  // Facebook variants
  if (normalized.includes('facebook') || normalized.includes('fb')) {
    return 'facebook';
  }

  // Instagram variants
  if (normalized.includes('instagram') || normalized.includes('ig')) {
    return 'instagram';
  }

  // Twitter/X variants
  if (normalized.includes('twitter') || normalized.includes('x.com') || normalized === 'x') {
    return 'twitter';
  }

  // WhatsApp variants
  if (normalized.includes('whatsapp') || normalized.includes('wa')) {
    return 'whatsapp';
  }

  // Reddit variants
  if (normalized.includes('reddit')) {
    return 'reddit';
  }

  // Telegram variants
  if (normalized.includes('telegram') || normalized.includes('tg')) {
    return 'telegram';
  }

  // TikTok variants
  if (normalized.includes('tiktok') || normalized.includes('tik-tok') || normalized === 'tiktok') {
    return 'tiktok';
  }

  // LinkedIn variants
  if (normalized.includes('linkedin') || normalized.includes('li')) {
    return 'linkedin';
  }

  // Email variants
  if (normalized.includes('email') || normalized.includes('newsletter') || normalized.includes('mail')) {
    return 'email';
  }

  // Direct/organic
  if (normalized === 'direct' || normalized === 'organic' || normalized === '') {
    return 'organic';
  }

  return 'other';
}

/**
 * Detect source from document referrer
 */
function detectFromReferrer(referrer: string): TrafficSource {
  const url = new URL(referrer);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // Facebook
  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
    return 'facebook';
  }

  // Instagram
  if (hostname.includes('instagram.com')) {
    return 'instagram';
  }

  // Twitter/X
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'twitter';
  }

  // WhatsApp
  if (hostname.includes('whatsapp.com') || hostname.includes('wa.me')) {
    return 'whatsapp';
  }

  // Reddit
  if (hostname.includes('reddit.com')) {
    return 'reddit';
  }

  // Telegram
  if (hostname.includes('telegram.com') || hostname.includes('t.me')) {
    return 'telegram';
  }

  // TikTok
  if (hostname.includes('tiktok.com') || hostname.includes('douyin.com')) {
    return 'tiktok';
  }

  // LinkedIn
  if (hostname.includes('linkedin.com')) {
    return 'linkedin';
  }

  // Email marketing platforms
  if (hostname.includes('mailchimp') || hostname.includes('constantcontact') || 
      hostname.includes('sendgrid') || hostname.includes('aweber')) {
    return 'email';
  }

  // Google search
  if (hostname.includes('google') && pathname.includes('search')) {
    return 'organic';
  }

  // Bing search
  if (hostname.includes('bing') && pathname.includes('search')) {
    return 'organic';
  }

  // DuckDuckGo
  if (hostname.includes('duckduckgo')) {
    return 'organic';
  }

  return 'direct';
}

/**
 * Build URL with source parameter for tracking
 */
export function buildTrackingUrl(baseUrl: string, source: TrafficSource, campaign?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', source);
  if (campaign) {
    url.searchParams.set('utm_campaign', campaign);
  }
  return url.toString();
}

/**
 * Get friendly display name for source
 */
export function getSourceDisplayName(source: TrafficSource): string {
  const names: Record<TrafficSource, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    whatsapp: 'WhatsApp',
    reddit: 'Reddit',
    telegram: 'Telegram',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    direct: 'Direct',
    email: 'Email',
    organic: 'Organic',
    other: 'Other'
  };

  return names[source] || 'Unknown';
}

/**
 * Get platform icon name for source
 */
export function getSourceIcon(source: TrafficSource): string {
  const icons: Record<TrafficSource, string> = {
    facebook: 'facebook',
    instagram: 'instagram',
    twitter: 'twitter',
    whatsapp: 'whatsapp',
    reddit: 'reddit',
    telegram: 'telegram',
    tiktok: 'tiktok',
    linkedin: 'linkedin',
    direct: 'link-2',
    email: 'mail',
    organic: 'search',
    other: 'globe'
  };

  return icons[source] || 'globe';
}
