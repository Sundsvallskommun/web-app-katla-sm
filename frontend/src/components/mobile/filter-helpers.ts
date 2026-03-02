import { MetadataResponseDTO } from '@data-contracts/backend/data-contracts';

export const getAllTypes = (metadata: MetadataResponseDTO | null) =>
  metadata?.categories?.flatMap(
    (cat) => cat.types?.map((t) => ({ name: t.name ?? '', displayName: t.displayName ?? t.name ?? '' })) ?? []
  ) ?? [];
