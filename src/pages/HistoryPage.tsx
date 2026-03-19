import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../types';
import {
  archiveConversation,
  deleteConversation,
  getActiveConversations,
  getArchivedConversations,
  getConversations,
  pinConversation,
  renameConversation,
  saveConversations,
  unpinConversation,
} from '../utils/storage';
import { getAppLanguage, t } from '../utils/i18n';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeChats, setActiveChats] = useState<Conversation[]>([]);
  const [archivedChats, setArchivedChats] = useState<Conversation[]>([]);
  const [menuChat, setMenuChat] = useState<Conversation | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const suppressOpenRef = useRef(false);
const appLanguage = getAppLanguage();

const historyText = {
  newChat: t('default', 'Default') === 'ডিফল্ট'
    ? 'নতুন চ্যাট'
    : appLanguage === 'hindi'
    ? 'नई चैट'
    : appLanguage === 'urdu'
    ? 'نئی چیٹ'
    : appLanguage === 'arabic'
    ? 'دردشة جديدة'
    : appLanguage === 'spanish'
    ? 'Nuevo chat'
    : appLanguage === 'french'
    ? 'Nouveau chat'
    : appLanguage === 'german'
    ? 'Neuer Chat'
    : appLanguage === 'portuguese'
    ? 'Novo chat'
    : appLanguage === 'russian'
    ? 'Новый чат'
    : appLanguage === 'turkish'
    ? 'Yeni sohbet'
    : appLanguage === 'indonesian'
    ? 'Chat baru'
    : appLanguage === 'chinese'
    ? '新聊天'
    : appLanguage === 'japanese'
    ? '新しいチャット'
    : appLanguage === 'korean'
    ? '새 채팅'
    : appLanguage === 'italian'
    ? 'Nuova chat'
    : appLanguage === 'thai'
    ? 'แชตใหม่'
    : appLanguage === 'vietnamese'
    ? 'Đoạn chat mới'
    : 'New chat',

  archivedChat: t('archived_chat', 'Archived chat'),
  upgrade: appLanguage === 'bangla'
    ? 'ASK-GPT প্লাসে আপগ্রেড'
    : appLanguage === 'hindi'
    ? 'ASK-GPT प्लस में अपग्रेड'
    : appLanguage === 'urdu'
    ? 'ASK-GPT پلس میں اپ گریڈ'
    : appLanguage === 'arabic'
    ? 'الترقية إلى ASK-GPT Plus'
    : appLanguage === 'spanish'
    ? 'Actualizar a ASK-GPT Plus'
    : appLanguage === 'french'
    ? 'Passer à ASK-GPT Plus'
    : appLanguage === 'german'
    ? 'Auf ASK-GPT Plus upgraden'
    : appLanguage === 'portuguese'
    ? 'Atualizar para ASK-GPT Plus'
    : appLanguage === 'russian'
    ? 'Перейти на ASK-GPT Plus'
    : appLanguage === 'turkish'
    ? 'ASK-GPT Plus’a yükselt'
    : appLanguage === 'indonesian'
    ? 'Upgrade ke ASK-GPT Plus'
    : appLanguage === 'chinese'
    ? '升级到 ASK-GPT Plus'
    : appLanguage === 'japanese'
    ? 'ASK-GPT Plus にアップグレード'
    : appLanguage === 'korean'
    ? 'ASK-GPT Plus로 업그레이드'
    : appLanguage === 'italian'
    ? 'Passa a ASK-GPT Plus'
    : appLanguage === 'thai'
    ? 'อัปเกรดเป็น ASK-GPT Plus'
    : appLanguage === 'vietnamese'
    ? 'Nâng cấp lên ASK-GPT Plus'
    : 'Upgrade to ASK-GPT Plus',

  premiumSoon: appLanguage === 'bangla'
    ? 'প্রিমিয়াম ফিচার শিগগিরই আসছে'
    : appLanguage === 'hindi'
    ? 'प्रीमियम फीचर जल्द आ रहे हैं'
    : appLanguage === 'urdu'
    ? 'پریمیم فیچرز جلد آ رہے ہیں'
    : appLanguage === 'arabic'
    ? 'ميزات بريميوم قريباً'
    : appLanguage === 'spanish'
    ? 'Funciones premium próximamente'
    : appLanguage === 'french'
    ? 'Fonctionnalités premium bientôt disponibles'
    : appLanguage === 'german'
    ? 'Premium-Funktionen kommen bald'
    : appLanguage === 'portuguese'
    ? 'Recursos premium em breve'
    : appLanguage === 'russian'
    ? 'Премиум-функции скоро появятся'
    : appLanguage === 'turkish'
    ? 'Premium özellikler yakında'
    : appLanguage === 'indonesian'
    ? 'Fitur premium segera hadir'
    : appLanguage === 'chinese'
    ? '高级功能即将推出'
    : appLanguage === 'japanese'
    ? 'プレミアム機能は近日公開'
    : appLanguage === 'korean'
    ? '프리미엄 기능 곧 제공'
    : appLanguage === 'italian'
    ? 'Funzionalità premium in arrivo'
    : appLanguage === 'thai'
    ? 'ฟีเจอร์พรีเมียมกำลังมา'
    : appLanguage === 'vietnamese'
    ? 'Tính năng premium sắp ra mắt'
    : 'Premium features coming soon',

  yourHistory: appLanguage === 'bangla'
    ? 'আপনার ASK-GPT হিস্টোরি'
    : appLanguage === 'hindi'
    ? 'आपकी ASK-GPT हिस्ट्री'
    : appLanguage === 'urdu'
    ? 'آپ کی ASK-GPT ہسٹری'
    : appLanguage === 'arabic'
    ? 'سجل ASK-GPT الخاص بك'
    : appLanguage === 'spanish'
    ? 'Tu historial de ASK-GPT'
    : appLanguage === 'french'
    ? 'Votre historique ASK-GPT'
    : appLanguage === 'german'
    ? 'Dein ASK-GPT-Verlauf'
    : appLanguage === 'portuguese'
    ? 'Seu histórico do ASK-GPT'
    : appLanguage === 'russian'
    ? 'Ваша история ASK-GPT'
    : appLanguage === 'turkish'
    ? 'ASK-GPT geçmişiniz'
    : appLanguage === 'indonesian'
    ? 'Riwayat ASK-GPT Anda'
    : appLanguage === 'chinese'
    ? '你的 ASK-GPT 历史记录'
    : appLanguage === 'japanese'
    ? 'あなたの ASK-GPT 履歴'
    : appLanguage === 'korean'
    ? '내 ASK-GPT 기록'
    : appLanguage === 'italian'
    ? 'La tua cronologia ASK-GPT'
    : appLanguage === 'thai'
    ? 'ประวัติ ASK-GPT ของคุณ'
    : appLanguage === 'vietnamese'
    ? 'Lịch sử ASK-GPT của bạn'
    : 'Your ASK-GPT history',

  noHistory: appLanguage === 'bangla'
    ? 'এখনও কোনো চ্যাট হিস্টোরি নেই'
    : appLanguage === 'hindi'
    ? 'अभी तक कोई चैट हिस्ट्री नहीं'
    : appLanguage === 'urdu'
    ? 'ابھی تک کوئی چیٹ ہسٹری نہیں'
    : appLanguage === 'arabic'
    ? 'لا يوجد سجل دردشة بعد'
    : appLanguage === 'spanish'
    ? 'Aún no hay historial de chat'
    : appLanguage === 'french'
    ? 'Aucun historique de chat pour le moment'
    : appLanguage === 'german'
    ? 'Noch kein Chatverlauf'
    : appLanguage === 'portuguese'
    ? 'Ainda não há histórico de chat'
    : appLanguage === 'russian'
    ? 'Истории чата пока нет'
    : appLanguage === 'turkish'
    ? 'Henüz sohbet geçmişi yok'
    : appLanguage === 'indonesian'
    ? 'Belum ada riwayat chat'
    : appLanguage === 'chinese'
    ? '还没有聊天记录'
    : appLanguage === 'japanese'
    ? 'まだチャット履歴がありません'
    : appLanguage === 'korean'
    ? '아직 채팅 기록이 없습니다'
    : appLanguage === 'italian'
    ? 'Nessuna cronologia chat ancora'
    : appLanguage === 'thai'
    ? 'ยังไม่มีประวัติแชต'
    : appLanguage === 'vietnamese'
    ? 'Chưa có lịch sử chat'
    : 'No chat history yet',

  pinned: appLanguage === 'bangla'
    ? 'পিন করা'
    : appLanguage === 'hindi'
    ? 'पिन किया गया'
    : appLanguage === 'urdu'
    ? 'پن کیا گیا'
    : appLanguage === 'arabic'
    ? 'مثبت'
    : appLanguage === 'spanish'
    ? 'Fijado'
    : appLanguage === 'french'
    ? 'Épinglé'
    : appLanguage === 'german'
    ? 'Angeheftet'
    : appLanguage === 'portuguese'
    ? 'Fixado'
    : appLanguage === 'russian'
    ? 'Закреплено'
    : appLanguage === 'turkish'
    ? 'Sabitlendi'
    : appLanguage === 'indonesian'
    ? 'Disematkan'
    : appLanguage === 'chinese'
    ? '已置顶'
    : appLanguage === 'japanese'
    ? '固定済み'
    : appLanguage === 'korean'
    ? '고정됨'
    : appLanguage === 'italian'
    ? 'Fissato'
    : appLanguage === 'thai'
    ? 'ปักหมุดแล้ว'
    : appLanguage === 'vietnamese'
    ? 'Đã ghim'
    : 'Pinned',

  rename: appLanguage === 'bangla'
    ? 'রিনেম'
    : appLanguage === 'hindi'
    ? 'नाम बदलें'
    : appLanguage === 'urdu'
    ? 'نام تبدیل کریں'
    : appLanguage === 'arabic'
    ? 'إعادة التسمية'
    : appLanguage === 'spanish'
    ? 'Renombrar'
    : appLanguage === 'french'
    ? 'Renommer'
    : appLanguage === 'german'
    ? 'Umbenennen'
    : appLanguage === 'portuguese'
    ? 'Renomear'
    : appLanguage === 'russian'
    ? 'Переименовать'
    : appLanguage === 'turkish'
    ? 'Yeniden adlandır'
    : appLanguage === 'indonesian'
    ? 'Ganti nama'
    : appLanguage === 'chinese'
    ? '重命名'
    : appLanguage === 'japanese'
    ? '名前を変更'
    : appLanguage === 'korean'
    ? '이름 바꾸기'
    : appLanguage === 'italian'
    ? 'Rinomina'
    : appLanguage === 'thai'
    ? 'เปลี่ยนชื่อ'
    : appLanguage === 'vietnamese'
    ? 'Đổi tên'
    : 'Rename',

  archive: appLanguage === 'bangla'
    ? 'আর্কাইভ'
    : appLanguage === 'hindi'
    ? 'संग्रहित करें'
    : appLanguage === 'urdu'
    ? 'آرکائیو'
    : appLanguage === 'arabic'
    ? 'أرشفة'
    : appLanguage === 'spanish'
    ? 'Archivar'
    : appLanguage === 'french'
    ? 'Archiver'
    : appLanguage === 'german'
    ? 'Archivieren'
    : appLanguage === 'portuguese'
    ? 'Arquivar'
    : appLanguage === 'russian'
    ? 'Архивировать'
    : appLanguage === 'turkish'
    ? 'Arşivle'
    : appLanguage === 'indonesian'
    ? 'Arsipkan'
    : appLanguage === 'chinese'
    ? '归档'
    : appLanguage === 'japanese'
    ? 'アーカイブ'
    : appLanguage === 'korean'
    ? '보관'
    : appLanguage === 'italian'
    ? 'Archivia'
    : appLanguage === 'thai'
    ? 'เก็บถาวร'
    : appLanguage === 'vietnamese'
    ? 'Lưu trữ'
    : 'Archive',

  pinChat: appLanguage === 'bangla'
    ? 'চ্যাট পিন করুন'
    : appLanguage === 'hindi'
    ? 'चैट पिन करें'
    : appLanguage === 'urdu'
    ? 'چیٹ پن کریں'
    : appLanguage === 'arabic'
    ? 'تثبيت الدردشة'
    : appLanguage === 'spanish'
    ? 'Fijar chat'
    : appLanguage === 'french'
    ? 'Épingler le chat'
    : appLanguage === 'german'
    ? 'Chat anheften'
    : appLanguage === 'portuguese'
    ? 'Fixar chat'
    : appLanguage === 'russian'
    ? 'Закрепить чат'
    : appLanguage === 'turkish'
    ? 'Sohbeti sabitle'
    : appLanguage === 'indonesian'
    ? 'Sematkan chat'
    : appLanguage === 'chinese'
    ? '置顶聊天'
    : appLanguage === 'japanese'
    ? 'チャットを固定'
    : appLanguage === 'korean'
    ? '채팅 고정'
    : appLanguage === 'italian'
    ? 'Fissa chat'
    : appLanguage === 'thai'
    ? 'ปักหมุดแชต'
    : appLanguage === 'vietnamese'
    ? 'Ghim chat'
    : 'Pin chat',

  unpinChat: appLanguage === 'bangla'
    ? 'চ্যাট আনপিন করুন'
    : appLanguage === 'hindi'
    ? 'चैट अनपिन करें'
    : appLanguage === 'urdu'
    ? 'چیٹ ان پن کریں'
    : appLanguage === 'arabic'
    ? 'إلغاء تثبيت الدردشة'
    : appLanguage === 'spanish'
    ? 'Desfijar chat'
    : appLanguage === 'french'
    ? 'Désépingler le chat'
    : appLanguage === 'german'
    ? 'Chat loslösen'
    : appLanguage === 'portuguese'
    ? 'Desafixar chat'
    : appLanguage === 'russian'
    ? 'Открепить чат'
    : appLanguage === 'turkish'
    ? 'Sohbet sabitlemesini kaldır'
    : appLanguage === 'indonesian'
    ? 'Lepas sematan chat'
    : appLanguage === 'chinese'
    ? '取消置顶聊天'
    : appLanguage === 'japanese'
    ? 'チャットの固定を解除'
    : appLanguage === 'korean'
    ? '채팅 고정 해제'
    : appLanguage === 'italian'
    ? 'Rimuovi chat fissata'
    : appLanguage === 'thai'
    ? 'เลิกปักหมุดแชต'
    : appLanguage === 'vietnamese'
    ? 'Bỏ ghim chat'
    : 'Unpin chat',

  deleteText: appLanguage === 'bangla'
    ? 'ডিলিট'
    : appLanguage === 'hindi'
    ? 'हटाएँ'
    : appLanguage === 'urdu'
    ? 'ڈیلیٹ'
    : appLanguage === 'arabic'
    ? 'حذف'
    : appLanguage === 'spanish'
    ? 'Eliminar'
    : appLanguage === 'french'
    ? 'Supprimer'
    : appLanguage === 'german'
    ? 'Löschen'
    : appLanguage === 'portuguese'
    ? 'Excluir'
    : appLanguage === 'russian'
    ? 'Удалить'
    : appLanguage === 'turkish'
    ? 'Sil'
    : appLanguage === 'indonesian'
    ? 'Hapus'
    : appLanguage === 'chinese'
    ? '删除'
    : appLanguage === 'japanese'
    ? '削除'
    : appLanguage === 'korean'
    ? '삭제'
    : appLanguage === 'italian'
    ? 'Elimina'
    : appLanguage === 'thai'
    ? 'ลบ'
    : appLanguage === 'vietnamese'
    ? 'Xóa'
    : 'Delete',
};
  const refreshChats = () => {
    const active = getActiveConversations().sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
      return b.lastUpdated - a.lastUpdated;
    });

    const archived = getArchivedConversations().sort((a, b) => b.lastUpdated - a.lastUpdated);

    setActiveChats(active);
    setArchivedChats(archived);
  };

  useEffect(() => {
    refreshChats();
  }, []);

  const openChat = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const openNewChat = () => {
    const newId = Date.now().toString();

    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      lastUpdated: Date.now(),
      archived: false,
      pinned: false,
    };

    const updated = [newConv, ...getConversations()];
    saveConversations(updated);
    navigate(`/chat/${newId}`);
  };

  const clearLongPress = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const startLongPress = (chat: Conversation) => {
    clearLongPress();
    holdTimerRef.current = window.setTimeout(() => {
      suppressOpenRef.current = true;
      setMenuChat(chat);
    }, 420);
  };

  const handleChatPress = (chat: Conversation) => {
    if (suppressOpenRef.current) {
      suppressOpenRef.current = false;
      return;
    }
    openChat(chat.id);
  };

  const handleRename = () => {
    if (!menuChat) return;
    const nextTitle = window.prompt(historyText.rename, menuChat.title);
    if (!nextTitle || !nextTitle.trim()) return;
    renameConversation(menuChat.id, nextTitle);
    setMenuChat(null);
    refreshChats();
  };

  const handleArchive = () => {
    if (!menuChat) return;
    archiveConversation(menuChat.id);
    setMenuChat(null);
    refreshChats();
  };

  const handlePinToggle = () => {
    if (!menuChat) return;
    if (menuChat.pinned) {
      unpinConversation(menuChat.id);
    } else {
      pinConversation(menuChat.id);
    }
    setMenuChat(null);
    refreshChats();
  };

  const handleDelete = () => {
    if (!menuChat) return;
    const ok = window.confirm(`${historyText.deleteText} "${menuChat.title}"?`);
    if (!ok) return;
    deleteConversation(menuChat.id);
    setMenuChat(null);
    refreshChats();
  };

  useEffect(() => {
    return () => clearLongPress();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[430px] px-5 pt-8 pb-10">
        <div className="space-y-4">
          <button
            type="button"
            onClick={openNewChat}
            className="w-full rounded-[22px] border border-[#ececf2] bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">
  {historyText.newChat}
</div>
          </button>

          <div className="overflow-hidden rounded-[22px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <button
  type="button"
  onClick={() => navigate('/history/archived')}
  className="flex w-full items-center justify-between px-5 py-4 text-left"
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
              <div>
  <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">
    {historyText.archivedChat}
  </div>
  <div className="mt-1 text-[13px] text-[#8a8a8f]">
    {archivedChats.length}{' '}
    {appLanguage === 'bangla'
      ? `আর্কাইভড চ্যাট${archivedChats.length === 1 ? '' : ''}`
      : appLanguage === 'hindi'
      ? `संग्रहित चैट${archivedChats.length === 1 ? '' : ''}`
      : appLanguage === 'urdu'
      ? `آرکائیوڈ چیٹ${archivedChats.length === 1 ? '' : ''}`
      : appLanguage === 'arabic'
      ? `دردشة مؤرشفة${archivedChats.length === 1 ? '' : ''}`
      : appLanguage === 'spanish'
      ? `chat archivado${archivedChats.length === 1 ? '' : 's'}`
      : appLanguage === 'french'
      ? `chat archivé${archivedChats.length === 1 ? '' : 's'}`
      : appLanguage === 'german'
      ? `archivierte Chats`
      : appLanguage === 'portuguese'
      ? `chat arquivado${archivedChats.length === 1 ? '' : 's'}`
      : appLanguage === 'russian'
      ? `архивный чат`
      : appLanguage === 'turkish'
      ? `arşivlenmiş sohbet`
      : appLanguage === 'indonesian'
      ? `chat arsip`
      : appLanguage === 'chinese'
      ? `个已归档聊天`
      : appLanguage === 'japanese'
      ? `件のアーカイブ済みチャット`
      : appLanguage === 'korean'
      ? `개의 보관된 채팅`
      : appLanguage === 'italian'
      ? `chat archiviat${archivedChats.length === 1 ? 'o' : 'i'}`
      : appLanguage === 'thai'
      ? `แชตที่เก็บถาวร`
      : appLanguage === 'vietnamese'
      ? `đoạn chat đã lưu trữ`
      : `archived chat${archivedChats.length === 1 ? '' : 's'}`}
  </div>
</div>
            </button>

            <div className="h-px bg-[#f0f1f5]" />

            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <div>
  <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]">
    {historyText.upgrade}
  </div>
  <div className="mt-1 text-[13px] text-[#8a8a8f]">
    {historyText.premiumSoon}
  </div>
</div>
            </button>
          </div>

          <div className="pt-3">
            <div
  className="mb-3 px-1 text-[15px] font-semibold tracking-[-0.01em] text-[#111111]"
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
  {historyText.yourHistory}
</div>

      <div className="h-[420px] overflow-hidden rounded-[22px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
  <div className="h-full overflow-y-auto">
    {activeChats.length === 0 ? (
      <div
  className="px-5 py-5 text-[14px] text-[#8a8a8f]"
  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
>
  {historyText.noHistory}
</div>
    ) : (
      activeChats.map((chat, index) => (
        <React.Fragment key={chat.id}>
          <button
            type="button"
            onClick={() => handleChatPress(chat)}
            onTouchStart={() => startLongPress(chat)}
            onTouchEnd={clearLongPress}
            onTouchMove={clearLongPress}
            onTouchCancel={clearLongPress}
            onMouseDown={() => startLongPress(chat)}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuChat(chat);
            }}
            className="block w-full px-5 py-4 text-left"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="truncate text-[16px] font-medium tracking-[-0.02em] text-[#111111]">
                {chat.title}
              </div>
              {chat.pinned && (
                <span className="shrink-0 text-[12px] font-medium text-[#8a8a8f]">
  {historyText.pinned}
</span>
              )}
            </div>
          </button>
          {index !== activeChats.length - 1 && <div className="h-px bg-[#f0f1f5]" />}
        </React.Fragment>
      ))
    )}
  </div>
</div>

{menuChat && (
  <div className="fixed inset-0 z-[60]">
    <button
      type="button"
      aria-label="Close menu"
      onClick={() => setMenuChat(null)}
      className="absolute inset-0 bg-black/10"
    />

    <div className="absolute left-1/2 bottom-6 w-[calc(100%-40px)] max-w-[360px] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#ececf2] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
      <button
        type="button"
        onClick={handleRename}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#111111]">{historyText.rename}</span>
      </button>

      <div className="h-px bg-[#f0f1f5]" />

      <button
        type="button"
        onClick={handleArchive}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#111111]">{historyText.archive}</span>
      </button>

      <div className="h-px bg-[#f0f1f5]" />

      <button
        type="button"
        onClick={handlePinToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#111111]">
  {menuChat.pinned ? historyText.unpinChat : historyText.pinChat}
</span>
      </button>

      <div className="h-px bg-[#f0f1f5]" />

      <button
        type="button"
        onClick={handleDelete}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        <span className="text-[17px] font-medium text-[#e53935]">{historyText.deleteText}</span>
      </button>
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
