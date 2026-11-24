// Teacher Eda — Central Contact & Branding Configuration
// Eda'nın gerçek iletişim bilgileri hazır olduğunda aşağıyı doldurabilirsiniz.

export const CONFIG = {
  brandName: 'Teacher Eda',
  // Örnek: '905321234567' (başında '+' veya boşluk olmadan)
  whatsappPhone: '',
  email: '',
  instagramHandle: '',
  instagramUrl: '',
  photoPath: './eda-photo.jpg',
};

/**
 * Mac Masaüstü WhatsApp Uygulaması için yerel protokol bağlantısı üretir.
 * Telefon numarası boş bırakıldıysa boş string döndürür.
 * @param {string} [message]
 * @returns {string}
 */
export function buildWhatsAppUrl(message = '') {
  const cleanPhone = String(CONFIG.whatsappPhone || '').replace(/\D/g, '');
  if (!cleanPhone) return '';
  if (message && message.trim().length > 0) {
    return `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  }
  return `whatsapp://send?phone=${cleanPhone}`;
}
