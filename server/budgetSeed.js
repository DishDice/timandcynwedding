export const BUDGET_CATEGORIES = [
  {
    name: 'CEREMONY',
    items: [
      { item: 'Ceremony Venue', estimate: 3700, actual: 3700, paid: 0, dueDate: '2026-10-01', notes: '80 seats + 1 security' },
      { item: 'Celebrant Fee', estimate: 0, actual: 0, paid: 0, status: 'Paid in Full' },
      { item: 'Vow Books', estimate: 20 },
      { item: 'Wedding Rings', estimate: 2500, actual: 4000, paid: 4000, status: 'Paid in Full', notes: 'Paid in full 30/05/2026 @Janai' },
      { item: 'Ring Boxes', estimate: 50 },
      { item: 'Pet Services', estimate: 400 },
    ],
  },
  {
    name: 'RECEPTION',
    items: [
      { item: 'Reception Venue', estimate: 31200, actual: 31200, paid: 5000, dueDate: '2026-10-01', notes: 'Paid $5k already' },
      { item: 'Miscellaneous Décor', estimate: 0 },
    ],
  },
  {
    name: 'PHOTOGRAPHY & VIDEOGRAPHY',
    items: [
      { item: 'Wedding Photographer', estimate: 7000, actual: 7000, paid: 2100, notes: '2nd instalment 10/7/2026 · 3rd instalment 26/9/2026' },
      { item: 'Wedding Videographer', estimate: 5280, actual: 5280, paid: 1584, dueDate: '2026-10-03' },
      { item: 'Photobooth', estimate: 749, actual: 749, paid: 150, dueDate: '2026-10-02' },
      { item: 'Instant & Film Camera Supplies', estimate: 180, notes: 'x6 cameras shared' },
      { item: 'Prints & Video Copies', estimate: 50 },
    ],
  },
  {
    name: 'STATIONERY & SIGNAGE',
    items: [
      { item: 'Save The Date', estimate: 0, status: 'Paid in Full', notes: 'Made on Canva' },
      { item: 'Invitations & RSVPs', estimate: 600, notes: 'Made on Canva — print at Officeworks' },
      { item: 'Postage', estimate: 0 },
      { item: 'Ceremony Programs', estimate: 100 },
      { item: 'Menus', estimate: 100 },
      { item: 'Place Cards', estimate: 50 },
      { item: 'Table Numbers', estimate: 0, status: 'Paid in Full', notes: 'Included at Harriett' },
      { item: 'Guest Book', estimate: 100 },
      { item: 'Signage (Welcome Sign, Seating Chart)', estimate: 200, notes: 'Easel available at Harriett' },
    ],
  },
  {
    name: 'FLORALS',
    items: [
      { item: 'Wedding Florals', estimate: 3426, actual: 3426, paid: 685 },
    ],
  },
  {
    name: "BRIDE'S FASHION",
    items: [
      { item: 'Wedding Dress', estimate: 0, notes: 'Mum paid' },
      { item: 'Alterations', estimate: 0 },
      { item: 'Shoes', estimate: 200, notes: 'Van Yi gifted shoes — pending fit' },
      { item: 'Accessories', estimate: 300 },
      { item: 'Undergarments', estimate: 100 },
      { item: 'Veil', estimate: 200 },
    ],
  },
  {
    name: "GROOM'S FASHION",
    items: [
      { item: "Groom's Attire", estimate: 2500, actual: 1100, paid: 1100, status: 'Paid in Full' },
      { item: 'Alterations', estimate: 100, actual: 0, status: 'Paid in Full' },
      { item: 'Shoes', estimate: 300 },
      { item: 'Accessories', estimate: 200 },
    ],
  },
  {
    name: 'BRIDAL PARTY FASHION',
    items: [
      { item: 'Bridesmaid Outfits', estimate: 450 },
      { item: 'Bridesmaid Accessories', estimate: 0 },
      { item: 'Groomsmen Attire', estimate: 900 },
      { item: 'Groomsmen Accessories', estimate: 300 },
    ],
  },
  {
    name: 'BEAUTY',
    items: [
      { item: 'Pre-wedding Spa Treatments', estimate: 1000 },
      { item: 'Pre-wedding Hair Cuts & Treatments', estimate: 200 },
      { item: 'Bridal Party/Mum/Bride Hair & Makeup', estimate: 2850, paid: 1140 },
    ],
  },
  {
    name: 'TRANSPORTATION',
    items: [
      { item: 'Transport to Wedding Destination', estimate: 0 },
      { item: 'Bridal Transport to Ceremony', estimate: 0 },
      { item: 'Groom Transport to Ceremony', estimate: 0 },
      { item: 'Bride & Groom Transport to Reception', estimate: 0 },
      { item: 'Bridal Party Transport to Reception', estimate: 0 },
    ],
  },
  {
    name: 'CATERING & DRINKS',
    items: [
      { item: 'Drinks', estimate: 600 },
      { item: 'Wedding Cake', estimate: 300 },
      { item: 'Additional Catering', estimate: 0 },
      { item: 'Late Night Food', estimate: 0 },
    ],
  },
  {
    name: 'MUSIC & ENTERTAINMENT',
    items: [
      { item: 'Ceremony Music', estimate: 0 },
      { item: 'Audio Rental', estimate: 0 },
      { item: 'MC', estimate: 0 },
      { item: 'Reception Band/DJ', estimate: 400, actual: 400, vendor: 'NOBU', dueDate: '2026-10-05' },
      { item: 'Additional Entertainment', estimate: 0 },
    ],
  },
  {
    name: 'FAVOURS & GIFTS',
    items: [
      { item: 'Gift for Bride', estimate: 0 },
      { item: 'Gift for Groom', estimate: 0 },
      { item: 'Gifts for Bridesmaids', estimate: 300, actual: 319, paid: 319, status: 'Paid in Full' },
      { item: 'Gifts for Groomsmen', estimate: 300 },
      { item: 'Bonbonniere', estimate: 1400 },
    ],
  },
  {
    name: 'ACCOMMODATION',
    items: [
      { item: 'Bride & Groom Accommodation (Night Before/After)', estimate: 2710, paid: 1280 },
      { item: 'Gifted Accommodation', estimate: 0 },
    ],
  },
  {
    name: 'HONEYMOON',
    items: [
      { item: 'Flights', estimate: 0 },
      { item: 'Accommodation', estimate: 0 },
      { item: 'Honeymoon Attire', estimate: 0 },
      { item: 'Romantic Dinners & Excursions', estimate: 0 },
      { item: 'Spending Money', estimate: 0 },
    ],
  },
];
