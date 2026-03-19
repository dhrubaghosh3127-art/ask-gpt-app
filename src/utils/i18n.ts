export type AppLanguage =
  | 'default'
  | 'english'
  | 'bangla'
  | 'hindi'
  | 'urdu'
  | 'arabic'
  | 'spanish'
  | 'french'
  | 'german'
  | 'portuguese'
  | 'russian'
  | 'turkish'
  | 'indonesian'
  | 'chinese'
  | 'japanese'
  | 'korean'
  | 'italian'
  | 'thai'
  | 'vietnamese';

export const getAppLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'default';

  const saved = localStorage.getItem('appLanguage') as AppLanguage | null;

  return (
    saved === 'default' ||
    saved === 'english' ||
    saved === 'bangla' ||
    saved === 'hindi' ||
    saved === 'urdu' ||
    saved === 'arabic' ||
    saved === 'spanish' ||
    saved === 'french' ||
    saved === 'german' ||
    saved === 'portuguese' ||
    saved === 'russian' ||
    saved === 'turkish' ||
    saved === 'indonesian' ||
    saved === 'chinese' ||
    saved === 'japanese' ||
    saved === 'korean' ||
    saved === 'italian' ||
    saved === 'thai' ||
    saved === 'vietnamese'
      ? saved
      : 'default'
  );
};

type TranslationKey =
  | 'appearance'
  | 'accent_color'
  | 'general'
  | 'notifications'
  | 'voice'
  | 'data_controls'
  | 'security'
  | 'report_bug'
  | 'about'
  | 'log_out'
  | 'language'
  | 'default'
  | 'my_profile'
  | 'settings_support'
  | 'privacy_policy'
  | 'your_api_key'
  | 'chat_history'
  | 'archived_chat'
  | 'history';

const translations: Record<
  Exclude<AppLanguage, 'default'>,
  Record<TranslationKey, string>
> = {
  english: {
    appearance: 'Appearance',
    accent_color: 'Accent color',
    general: 'General',
    notifications: 'Notifications',
    voice: 'Voice',
    data_controls: 'Data controls',
    security: 'Security',
    report_bug: 'Report bug',
    about: 'About',
    log_out: 'Log out',
    language: 'Language',
    default: 'Default',
    my_profile: 'My Profile',
    settings_support: 'Settings & Support',
    privacy_policy: 'Privacy Policy',
    your_api_key: 'Your API Key',
    chat_history: 'Chat History',
    archived_chat: 'Archived chat',
    history: 'History',
  },
  bangla: {
    appearance: 'অ্যাপিয়ারেন্স',
    accent_color: 'অ্যাকসেন্ট কালার',
    general: 'জেনারেল',
    notifications: 'নোটিফিকেশন',
    voice: 'ভয়েস',
    data_controls: 'ডাটা কন্ট্রোলস',
    security: 'সিকিউরিটি',
    report_bug: 'বাগ রিপোর্ট',
    about: 'অ্যাবাউট',
    log_out: 'লগ আউট',
    language: 'ভাষা',
    default: 'ডিফল্ট',
    my_profile: 'আমার প্রোফাইল',
    settings_support: 'সেটিংস ও সাপোর্ট',
    privacy_policy: 'প্রাইভেসি পলিসি',
    your_api_key: 'আপনার API Key',
    chat_history: 'চ্যাট হিস্টোরি',
    archived_chat: 'আর্কাইভড চ্যাট',
    history: 'হিস্টোরি',
  },
  hindi: {
    appearance: 'दिखावट',
    accent_color: 'एक्सेंट रंग',
    general: 'सामान्य',
    notifications: 'सूचनाएँ',
    voice: 'वॉइस',
    data_controls: 'डेटा नियंत्रण',
    security: 'सुरक्षा',
    report_bug: 'बग रिपोर्ट',
    about: 'जानकारी',
    log_out: 'लॉग आउट',
    language: 'भाषा',
    default: 'डिफ़ॉल्ट',
    my_profile: 'मेरा प्रोफ़ाइल',
    settings_support: 'सेटिंग्स और सपोर्ट',
    privacy_policy: 'प्राइवेसी पॉलिसी',
    your_api_key: 'आपकी API Key',
    chat_history: 'चैट हिस्ट्री',
    archived_chat: 'आर्काइव्ड चैट',
    history: 'हिस्ट्री',
  },
  urdu: {
    appearance: 'ظاہری شکل',
    accent_color: 'ایکسنٹ رنگ',
    general: 'جنرل',
    notifications: 'نوٹیفیکیشنز',
    voice: 'وائس',
    data_controls: 'ڈیٹا کنٹرولز',
    security: 'سیکیورٹی',
    report_bug: 'بگ رپورٹ',
    about: 'تفصیل',
    log_out: 'لاگ آؤٹ',
    language: 'زبان',
    default: 'ڈیفالٹ',
    my_profile: 'میرا پروفائل',
    settings_support: 'سیٹنگز اور سپورٹ',
    privacy_policy: 'پرائیویسی پالیسی',
    your_api_key: 'آپ کی API Key',
    chat_history: 'چیٹ ہسٹری',
    archived_chat: 'آرکائیوڈ چیٹ',
    history: 'ہسٹری',
  },
  arabic: {
    appearance: 'المظهر',
    accent_color: 'لون التمييز',
    general: 'عام',
    notifications: 'الإشعارات',
    voice: 'الصوت',
    data_controls: 'عناصر التحكم بالبيانات',
    security: 'الأمان',
    report_bug: 'الإبلاغ عن خطأ',
    about: 'حول',
    log_out: 'تسجيل الخروج',
    language: 'اللغة',
    default: 'افتراضي',
    my_profile: 'ملفي الشخصي',
    settings_support: 'الإعدادات والدعم',
    privacy_policy: 'سياسة الخصوصية',
    your_api_key: 'مفتاح API الخاص بك',
    chat_history: 'سجل الدردشة',
    archived_chat: 'الدردشة المؤرشفة',
    history: 'السجل',
  },
  spanish: {
    appearance: 'Apariencia',
    accent_color: 'Color de acento',
    general: 'General',
    notifications: 'Notificaciones',
    voice: 'Voz',
    data_controls: 'Controles de datos',
    security: 'Seguridad',
    report_bug: 'Reportar error',
    about: 'Acerca de',
    log_out: 'Cerrar sesión',
    language: 'Idioma',
    default: 'Predeterminado',
    my_profile: 'Mi perfil',
    settings_support: 'Configuración y soporte',
    privacy_policy: 'Política de privacidad',
    your_api_key: 'Tu API Key',
    chat_history: 'Historial de chat',
    archived_chat: 'Chat archivado',
    history: 'Historial',
  },
  french: {
    appearance: 'Apparence',
    accent_color: "Couleur d'accent",
    general: 'Général',
    notifications: 'Notifications',
    voice: 'Voix',
    data_controls: 'Contrôles des données',
    security: 'Sécurité',
    report_bug: 'Signaler un bug',
    about: 'À propos',
    log_out: 'Se déconnecter',
    language: 'Langue',
    default: 'Par défaut',
    my_profile: 'Mon profil',
    settings_support: 'Paramètres et assistance',
    privacy_policy: 'Politique de confidentialité',
    your_api_key: 'Votre API Key',
    chat_history: 'Historique du chat',
    archived_chat: 'Chat archivé',
    history: 'Historique',
  },
  german: {
    appearance: 'Darstellung',
    accent_color: 'Akzentfarbe',
    general: 'Allgemein',
    notifications: 'Benachrichtigungen',
    voice: 'Stimme',
    data_controls: 'Datensteuerung',
    security: 'Sicherheit',
    report_bug: 'Fehler melden',
    about: 'Info',
    log_out: 'Abmelden',
    language: 'Sprache',
    default: 'Standard',
    my_profile: 'Mein Profil',
    settings_support: 'Einstellungen & Support',
    privacy_policy: 'Datenschutzrichtlinie',
    your_api_key: 'Dein API Key',
    chat_history: 'Chatverlauf',
    archived_chat: 'Archivierter Chat',
    history: 'Verlauf',
  },
  portuguese: {
    appearance: 'Aparência',
    accent_color: 'Cor de destaque',
    general: 'Geral',
    notifications: 'Notificações',
    voice: 'Voz',
    data_controls: 'Controles de dados',
    security: 'Segurança',
    report_bug: 'Reportar bug',
    about: 'Sobre',
    log_out: 'Sair',
    language: 'Idioma',
    default: 'Padrão',
    my_profile: 'Meu perfil',
    settings_support: 'Configurações e suporte',
    privacy_policy: 'Política de privacidade',
    your_api_key: 'Sua API Key',
    chat_history: 'Histórico de chat',
    archived_chat: 'Chat arquivado',
    history: 'Histórico',
  },
  russian: {
    appearance: 'Внешний вид',
    accent_color: 'Акцентный цвет',
    general: 'Общие',
    notifications: 'Уведомления',
    voice: 'Голос',
    data_controls: 'Управление данными',
    security: 'Безопасность',
    report_bug: 'Сообщить об ошибке',
    about: 'О приложении',
    log_out: 'Выйти',
    language: 'Язык',
    default: 'По умолчанию',
    my_profile: 'Мой профиль',
    settings_support: 'Настройки и поддержка',
    privacy_policy: 'Политика конфиденциальности',
    your_api_key: 'Ваш API Key',
    chat_history: 'История чата',
    archived_chat: 'Архивный чат',
    history: 'История',
  },
  turkish: {
    appearance: 'Görünüm',
    accent_color: 'Vurgu rengi',
    general: 'Genel',
    notifications: 'Bildirimler',
    voice: 'Ses',
    data_controls: 'Veri kontrolleri',
    security: 'Güvenlik',
    report_bug: 'Hata bildir',
    about: 'Hakkında',
    log_out: 'Çıkış yap',
    language: 'Dil',
    default: 'Varsayılan',
    my_profile: 'Profilim',
    settings_support: 'Ayarlar ve destek',
    privacy_policy: 'Gizlilik politikası',
    your_api_key: 'API Key’iniz',
    chat_history: 'Sohbet geçmişi',
    archived_chat: 'Arşivlenmiş sohbet',
    history: 'Geçmiş',
  },
  indonesian: {
    appearance: 'Tampilan',
    accent_color: 'Warna aksen',
    general: 'Umum',
    notifications: 'Notifikasi',
    voice: 'Suara',
    data_controls: 'Kontrol data',
    security: 'Keamanan',
    report_bug: 'Laporkan bug',
    about: 'Tentang',
    log_out: 'Keluar',
    language: 'Bahasa',
    default: 'Default',
    my_profile: 'Profil saya',
    settings_support: 'Pengaturan & dukungan',
    privacy_policy: 'Kebijakan privasi',
    your_api_key: 'API Key Anda',
    chat_history: 'Riwayat chat',
    archived_chat: 'Chat yang diarsipkan',
    history: 'Riwayat',
  },
  chinese: {
    appearance: '外观',
    accent_color: '强调色',
    general: '通用',
    notifications: '通知',
    voice: '语音',
    data_controls: '数据控制',
    security: '安全',
    report_bug: '报告错误',
    about: '关于',
    log_out: '退出登录',
    language: '语言',
    default: '默认',
    my_profile: '我的资料',
    settings_support: '设置与支持',
    privacy_policy: '隐私政策',
    your_api_key: '你的 API Key',
    chat_history: '聊天记录',
    archived_chat: '已归档聊天',
    history: '历史记录',
  },
  japanese: {
    appearance: '外観',
    accent_color: 'アクセントカラー',
    general: '一般',
    notifications: '通知',
    voice: '音声',
    data_controls: 'データ管理',
    security: 'セキュリティ',
    report_bug: 'バグを報告',
    about: 'このアプリについて',
    log_out: 'ログアウト',
    language: '言語',
    default: 'デフォルト',
    my_profile: 'マイプロフィール',
    settings_support: '設定とサポート',
    privacy_policy: 'プライバシーポリシー',
    your_api_key: 'あなたの API Key',
    chat_history: 'チャット履歴',
    archived_chat: 'アーカイブ済みチャット',
    history: '履歴',
  },
  korean: {
    appearance: '화면 설정',
    accent_color: '강조 색상',
    general: '일반',
    notifications: '알림',
    voice: '음성',
    data_controls: '데이터 제어',
    security: '보안',
    report_bug: '버그 신고',
    about: '정보',
    log_out: '로그아웃',
    language: '언어',
    default: '기본값',
    my_profile: '내 프로필',
    settings_support: '설정 및 지원',
    privacy_policy: '개인정보 처리방침',
    your_api_key: '내 API Key',
    chat_history: '채팅 기록',
    archived_chat: '보관된 채팅',
    history: '기록',
  },
  italian: {
    appearance: 'Aspetto',
    accent_color: 'Colore accento',
    general: 'Generale',
    notifications: 'Notifiche',
    voice: 'Voce',
    data_controls: 'Controlli dati',
    security: 'Sicurezza',
    report_bug: 'Segnala bug',
    about: 'Informazioni',
    log_out: 'Esci',
    language: 'Lingua',
    default: 'Predefinito',
    my_profile: 'Il mio profilo',
    settings_support: 'Impostazioni e supporto',
    privacy_policy: 'Informativa sulla privacy',
    your_api_key: 'La tua API Key',
    chat_history: 'Cronologia chat',
    archived_chat: 'Chat archiviate',
    history: 'Cronologia',
  },
  thai: {
    appearance: 'ลักษณะ',
    accent_color: 'สีเน้น',
    general: 'ทั่วไป',
    notifications: 'การแจ้งเตือน',
    voice: 'เสียง',
    data_controls: 'การควบคุมข้อมูล',
    security: 'ความปลอดภัย',
    report_bug: 'รายงานบั๊ก',
    about: 'เกี่ยวกับ',
    log_out: 'ออกจากระบบ',
    language: 'ภาษา',
    default: 'ค่าเริ่มต้น',
    my_profile: 'โปรไฟล์ของฉัน',
    settings_support: 'การตั้งค่าและการสนับสนุน',
    privacy_policy: 'นโยบายความเป็นส่วนตัว',
    your_api_key: 'API Key ของคุณ',
    chat_history: 'ประวัติแชต',
    archived_chat: 'แชตที่เก็บถาวร',
    history: 'ประวัติ',
  },
  vietnamese: {
    appearance: 'Giao diện',
    accent_color: 'Màu nhấn',
    general: 'Chung',
    notifications: 'Thông báo',
    voice: 'Giọng nói',
    data_controls: 'Kiểm soát dữ liệu',
    security: 'Bảo mật',
    report_bug: 'Báo lỗi',
    about: 'Giới thiệu',
    log_out: 'Đăng xuất',
    language: 'Ngôn ngữ',
    default: 'Mặc định',
    my_profile: 'Hồ sơ của tôi',
    settings_support: 'Cài đặt & hỗ trợ',
    privacy_policy: 'Chính sách riêng tư',
    your_api_key: 'API Key của bạn',
    chat_history: 'Lịch sử chat',
    archived_chat: 'Chat đã lưu trữ',
    history: 'Lịch sử',
  },
};

export const t = (key: TranslationKey, fallback: string): string => {
  const lang = getAppLanguage();
  if (lang === 'default') return fallback;
  return translations[lang]?.[key] || fallback;
};
