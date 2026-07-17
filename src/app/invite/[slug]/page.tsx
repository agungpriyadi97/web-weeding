import InvitationPage from '@/components/InvitationPage';
import { getWeddingInfo, getParents, getGallery, getGiftAccounts, getGuests, getLoveStories, getEvents, getThemeSettings } from '@/utils/db';
import { WeddingData } from '@/types/wedding';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const guests = await getGuests();
  const guest = guests.find(g => g.slug === slug);

  // If the guest is not registered in the list, fall back to standard home behavior or render with formatted slug
  const guestName = guest 
    ? guest.guest_name 
    : slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const info = await getWeddingInfo();
  const parents = await getParents();
  const gallery = await getGallery();
  const giftAccounts = await getGiftAccounts();
  const loveStories = await getLoveStories();
  const events = await getEvents();
  const themeSettings = await getThemeSettings();

  const initialData: WeddingData = {
    groom: {
      namaLengkap: info.groom_name,
      namaPanggilan: info.groom_nickname,
      fatherName: parents.find(p => p.type === 'groom')?.father_name,
      motherName: parents.find(p => p.type === 'groom')?.mother_name,
      fatherPhoto: parents.find(p => p.type === 'groom')?.father_photo,
      motherPhoto: parents.find(p => p.type === 'groom')?.mother_photo,
    },
    bride: {
      namaLengkap: info.bride_name,
      namaPanggilan: info.bride_nickname,
      fatherName: parents.find(p => p.type === 'bride')?.father_name,
      motherName: parents.find(p => p.type === 'bride')?.mother_name,
      fatherPhoto: parents.find(p => p.type === 'bride')?.father_photo,
      motherPhoto: parents.find(p => p.type === 'bride')?.mother_photo,
    },
    event: info,
    parents,
    gallery,
    giftAccounts,
    guests,
    closingMessage: info.closing_message || '',
    loveStories,
    events,
    themeSettings,
  };

  return <InvitationPage initialData={initialData} guestName={guestName} />;// Render invitation page with personal data
}
