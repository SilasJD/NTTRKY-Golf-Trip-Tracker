export type Hole = {
  number: number;
  par: number;
  yards: number;
};

export type Course = {
  slug: "wolf-creek" | "mt-ogden";
  name: string;
  location: string;
  par: number;
  holes: Hole[];
};

export const courses: Course[] = [
  {
    slug: "wolf-creek",
    name: "Wolf Creek Resort",
    location: "Eden, UT",
    par: 71,
    holes: [
      { number: 1, par: 4, yards: 354 },
      { number: 2, par: 5, yards: 483 },
      { number: 3, par: 4, yards: 361 },
      { number: 4, par: 3, yards: 143 },
      { number: 5, par: 5, yards: 481 },
      { number: 6, par: 3, yards: 140 },
      { number: 7, par: 4, yards: 361 },
      { number: 8, par: 3, yards: 172 },
      { number: 9, par: 5, yards: 488 },
      { number: 10, par: 4, yards: 384 },
      { number: 11, par: 5, yards: 519 },
      { number: 12, par: 4, yards: 367 },
      { number: 13, par: 3, yards: 191 },
      { number: 14, par: 4, yards: 340 },
      { number: 15, par: 4, yards: 422 },
      { number: 16, par: 3, yards: 162 },
      { number: 17, par: 4, yards: 389 },
      { number: 18, par: 4, yards: 375 },
    ],
  },
  {
    slug: "mt-ogden",
    name: "Mt. Ogden Golf Course",
    location: "Ogden, UT",
    par: 71,
    holes: [
      { number: 1, par: 4, yards: 272 },
      { number: 2, par: 4, yards: 312 },
      { number: 3, par: 4, yards: 330 },
      { number: 4, par: 5, yards: 470 },
      { number: 5, par: 3, yards: 160 },
      { number: 6, par: 5, yards: 471 },
      { number: 7, par: 4, yards: 454 },
      { number: 8, par: 3, yards: 163 },
      { number: 9, par: 4, yards: 345 },
      { number: 10, par: 4, yards: 428 },
      { number: 11, par: 4, yards: 320 },
      { number: 12, par: 3, yards: 104 },
      { number: 13, par: 4, yards: 351 },
      { number: 14, par: 3, yards: 161 },
      { number: 15, par: 4, yards: 256 },
      { number: 16, par: 4, yards: 375 },
      { number: 17, par: 4, yards: 443 },
      { number: 18, par: 5, yards: 471 },
    ],
  },
];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}
