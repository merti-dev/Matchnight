import type { Locale } from './config';

/**
 * Yasal metinler. Künye (Impressum) bilgileri ortam değişkenlerinden gelir:
 * IMPRINT_NAME, IMPRINT_ADDRESS, IMPRINT_EMAIL. Ayarlı değilse sayfa bunu açıkça
 * söyler — sahte ya da boş bir künye yayına çıkmaz.
 *
 * Not: Bu metinler bir başlangıç şablonudur, hukuki danışmanlık değildir.
 * Reklam/analitik eklendiğinde gizlilik metni ve çerez onayı güncellenmelidir.
 */
export const legal: Record<Locale, {
  imprintTitle: string;
  imprintLaw: string;
  contact: string;
  notConfigured: string;
  privacyTitle: string;
  privacy: string[];
}> = {
  de: {
    imprintTitle: 'Impressum',
    imprintLaw: 'Angaben gemäß § 5 DDG',
    contact: 'Kontakt',
    notConfigured: 'Das Impressum ist noch nicht konfiguriert.',
    privacyTitle: 'Datenschutzerklärung',
    privacy: [
      'Diese Website setzt keine Cookies und verwendet keine Analyse- oder Werbedienste.',
      'Beim Aufruf verarbeitet der Webserver technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browserkennung) in Server-Logdateien, um den Betrieb und die Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).',
      'Die Server stehen in Deutschland. Spieldaten werden serverseitig von öffentlichen Quellen geladen; Ihr Browser verbindet sich dabei mit keinem Dritten.',
      'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung sowie ein Beschwerderecht bei einer Aufsichtsbehörde. Kontakt: siehe Impressum.',
    ],
  },
  en: {
    imprintTitle: 'Legal notice',
    imprintLaw: 'Information pursuant to § 5 DDG (German Digital Services Act)',
    contact: 'Contact',
    notConfigured: 'The legal notice has not been configured yet.',
    privacyTitle: 'Privacy policy',
    privacy: [
      'This website sets no cookies and uses no analytics or advertising services.',
      'When you visit, the web server processes technically necessary data (IP address, time, requested page, browser identifier) in server log files to keep the service running and secure (Art. 6(1)(f) GDPR).',
      'The servers are located in Germany. Match data is loaded server-side from public sources; your browser does not connect to any third party.',
      'You have the right to access, rectification, erasure and restriction of processing, and the right to lodge a complaint with a supervisory authority. Contact: see legal notice.',
    ],
  },
  tr: {
    imprintTitle: 'Künye',
    imprintLaw: '§ 5 DDG (Alman Dijital Hizmetler Yasası) uyarınca bilgiler',
    contact: 'İletişim',
    notConfigured: 'Künye henüz yapılandırılmadı.',
    privacyTitle: 'Gizlilik politikası',
    privacy: [
      'Bu site çerez kullanmaz; analiz ya da reklam servisi içermez.',
      'Siteyi ziyaret ettiğinde sunucu, hizmetin çalışması ve güvenliği için teknik olarak gerekli verileri (IP adresi, zaman, istenen sayfa, tarayıcı bilgisi) sunucu kayıtlarında işler (GDPR md. 6/1-f).',
      'Sunucular Almanya’dadır. Maç verileri sunucu tarafında açık kaynaklardan çekilir; tarayıcın hiçbir üçüncü tarafa bağlanmaz.',
      'Verilerine erişim, düzeltme, silme ve işlemenin kısıtlanması hakların ile bir denetim makamına şikâyet hakkın vardır. İletişim: künyeye bak.',
    ],
  },
};
