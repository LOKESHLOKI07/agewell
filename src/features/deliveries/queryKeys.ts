export const deliveryQueryKeys = {
  member: ['deliveries', 'member'] as const,
  memberDetail: (deliveryId: string) => ['deliveries', 'member', deliveryId] as const,
};
