import InvitationPage from '@/components/InvitationPage';
import { getWeddingInfo, getParents, getGallery, getGiftAccounts, getGuests } from '@/utils/db';
import { WeddingData } from '@/types/wedding';

interface PageProps {
  searchParams: Promise<{ to?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const guestName = resolvedSearchParams.to || null;

  const info = await getWeddingInfo();
  const parents = await getParents();
  const gallery = await getGallery();
  const giftAccounts = await getGiftAccounts();
  const guests = await getGuests();

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
  };

  return <InvitationPage initialData={initialData} guestName={guestName} />;
}
