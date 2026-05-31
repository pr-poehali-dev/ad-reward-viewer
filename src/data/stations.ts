export interface Station {
  id: number;
  name: string;
  genre: string;
  country: string;
  description: string;
  streamUrl: string;
  logo: string;
  listeners?: number;
}

export const GENRES = ["Все", "Поп", "Рок", "Джаз", "Электронная", "Классика", "Новости", "Хип-хоп", "Регги", "Кантри"];

export const stations: Station[] = [
  {
    id: 1,
    name: "Европа Плюс",
    genre: "Поп",
    country: "Россия",
    description: "Лучшие хиты современной музыки",
    streamUrl: "https://ep256.hostingradio.ru/ep256.mp3",
    logo: "🎵",
    listeners: 12400,
  },
  {
    id: 2,
    name: "Радио Рекорд",
    genre: "Электронная",
    country: "Россия",
    description: "Электронная и танцевальная музыка 24/7",
    streamUrl: "https://radiorecord.hostingradio.ru/rr96.aacp",
    logo: "🎛️",
    listeners: 8900,
  },
  {
    id: 3,
    name: "Наше Радио",
    genre: "Рок",
    country: "Россия",
    description: "Русский рок — лучшее за все годы",
    streamUrl: "https://nashe1.hostingradio.ru/nashe-128.mp3",
    logo: "🎸",
    listeners: 7200,
  },
  {
    id: 4,
    name: "Jazz FM",
    genre: "Джаз",
    country: "Великобритания",
    description: "Классический и современный джаз",
    streamUrl: "https://stream.jazz.fm/jazz",
    logo: "🎷",
    listeners: 3400,
  },
  {
    id: 5,
    name: "Классик FM",
    genre: "Классика",
    country: "Россия",
    description: "Лучшая классическая музыка мира",
    streamUrl: "https://classic.hostingradio.ru/classic96.aacp",
    logo: "🎻",
    listeners: 2100,
  },
  {
    id: 6,
    name: "Радио России",
    genre: "Новости",
    country: "Россия",
    description: "Новости, культура и общественная жизнь",
    streamUrl: "https://icecast.vgtrk.cdnvideo.ru/rr_mp3_192kbps",
    logo: "📻",
    listeners: 15600,
  },
  {
    id: 7,
    name: "DFM",
    genre: "Электронная",
    country: "Россия",
    description: "Клубная и электронная музыка",
    streamUrl: "https://dfm.hostingradio.ru/dfm96.aacp",
    logo: "⚡",
    listeners: 5500,
  },
  {
    id: 8,
    name: "Ретро FM",
    genre: "Поп",
    country: "Россия",
    description: "Хиты 70-х, 80-х и 90-х годов",
    streamUrl: "https://retro.hostingradio.ru/retro96.aacp",
    logo: "🕺",
    listeners: 9800,
  },
  {
    id: 9,
    name: "Авторадио",
    genre: "Поп",
    country: "Россия",
    description: "Отличная музыка для дороги",
    streamUrl: "https://autoradio.hostingradio.ru/autoradio96.aacp",
    logo: "🚗",
    listeners: 11200,
  },
  {
    id: 10,
    name: "Radio Monte Carlo",
    genre: "Джаз",
    country: "Россия",
    description: "Элегантная музыка в стиле Монте-Карло",
    streamUrl: "https://rmc1.hostingradio.ru/rmc96.aacp",
    logo: "🎩",
    listeners: 4300,
  },
  {
    id: 11,
    name: "Маяк",
    genre: "Новости",
    country: "Россия",
    description: "Новости каждые полчаса, музыка всегда",
    streamUrl: "https://icecast.vgtrk.cdnvideo.ru/mayak_mp3_192kbps",
    logo: "⚓",
    listeners: 6700,
  },
  {
    id: 12,
    name: "Rock FM",
    genre: "Рок",
    country: "Россия",
    description: "Рок без границ — классика и современность",
    streamUrl: "https://rockfm.hostingradio.ru/rockfm96.aacp",
    logo: "🤘",
    listeners: 6100,
  },
];
