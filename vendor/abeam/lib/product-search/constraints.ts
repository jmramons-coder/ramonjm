/** Shared input bounds for Explorer controls and the authenticated API. */
export const PRODUCT_SEARCH_LIMITS = {
  queryLength: 240,
  originLength: 100,
  destinationLength: 160,
  dateLength: 10,
  minAdults: 1,
  maxAdults: 9,
  minChildAge: 0,
  maxChildAge: 17,
  maxChildren: 8,
  maxFlightTravellers: 9,
  maxPrice: 100_000,
  maxFutureDays: 730,
} as const;
