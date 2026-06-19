export type ItineraryDay = {
  date: string;
  label: string;
  items: string[];
};

export const itinerary: ItineraryDay[] = [
  {
    date: "2026-07-16",
    label: "Thu 7/16",
    items: ["Wolf Creek Golf", "Sodas", "Pickle Ball", "Hot Tub", "Shooting Star Saloon"],
  },
  {
    date: "2026-07-17",
    label: "Fri 7/17",
    items: ["Mt Ogden Golf Course", "Salt Lake City"],
  },
  {
    date: "2026-07-18",
    label: "Sat 7/18",
    items: ["Wolf Creek Golf or UTV Tour", "Lunch at Snowbasin", "9 holes Wolf Creek", "Ogden Valley Pizza"],
  },
  {
    date: "2026-07-19",
    label: "Sun 7/19",
    items: ["Wolf Creek Golf", "Lunch at Snowbasin"],
  },
];

export const tripStartDate = "2026-07-16";
export const tripEndDate = "2026-07-19";
