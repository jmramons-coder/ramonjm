/** A completed conversation can skip filing only when its saved IDs still resolve. */
export function conversationDestination<Client extends { id: string }, Trip extends { id: string; clientId: string }>(
  clients: Client[],
  trips: Trip[],
  setup: { clientId?: string; tripId?: string },
): { client: Client | undefined; trip: Trip | undefined; folderKey: string | null } {
  const client = setup.clientId ? clients.find((item) => item.id === setup.clientId) : undefined;
  const trip = client && setup.tripId
    ? trips.find((item) => item.id === setup.tripId && item.clientId === client.id)
    : undefined;

  return { client, trip, folderKey: client && trip ? `${client.id}::${trip.id}` : null };
}
