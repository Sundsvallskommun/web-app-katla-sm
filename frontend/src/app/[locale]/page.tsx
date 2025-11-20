'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { getMetadata } from '@services/errand-service/errand-service';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMetadataStore } from 'src/stores/metadata-store';

const Index = () => {
  const router = useRouter();
  const { setMetadata } = useMetadataStore();

  useEffect(() => {
    getMetadata().then((res) => setMetadata(res));
    router.push('/oversikt');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return <LoaderFullScreen />;
};

export default Index;
