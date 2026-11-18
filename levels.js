/* ============================================================
   ХОМА-ХУЛИГАН — данные уровней
   ============================================================ */
(function () {
  'use strict';

  const L1_HIDES = [
    { x: 100, y: 720, w: 180, h: 105, ax: 315, ay: 790, px: 154, py: 756, label: 'в сундуке' },
    { x: 1030, y: 720, w: 150, h: 120, ax: 1005, ay: 810, px: 1095, py: 772, label: 'в коробке' },
    { x: 350, y: 270, w: 120, h: 100, ax: 320, ay: 320, px: 410, py: 320, label: 'в коробке' },
    { x: 360, y: 760, w: 130, h: 105, ax: 330, ay: 812, px: 425, py: 812, label: 'в коробке' },
    { x: 1010, y: 180, w: 120, h: 100, ax: 980, ay: 230, px: 1070, py: 230, label: 'в коробке' },
    { x: 530, y: 400, w: 230, h: 120, ax: 645, ay: 552, px: 645, py: 462, label: 'под столом' }
  ];

  window.LEVELS = [
    {
      id: 1,
      place: 'ПОДВАЛ',
      name: 'Игрушечный погром',
      short: 'Большая игровая комната',
      art: '🧸',
      cardColor: '#d8f3e5',
      world: { w: 1600, h: 1050 },
      floor: {
        base: '#cdbfae',
        zones: [
          { x: 36, y: 36, w: 1528, h: 978, style: 'mat', tone: '#cbbcab' }
        ]
      },
      walls: [
        { x: 0, y: 0, w: 1600, h: 36 },
        { x: 0, y: 1014, w: 1600, h: 36 },
        { x: 0, y: 0, w: 36, h: 1050 },
        { x: 1564, y: 0, w: 36, h: 1050 }
      ],
      decor: [
        { type: 'window', x: 690, y: 0, w: 170, h: 36, night: false },
        { type: 'window', x: 1120, y: 0, w: 120, h: 36, night: true },
        { type: 'poster', x: 180, y: 38, w: 110, h: 62, text: 'ХОМА' },
        { type: 'poster', x: 1330, y: 38, w: 90, h: 54, text: '★' }
      ],
      labels: [
        { text: 'ИГРОВАЯ КОМНАТА', x: 90, y: 490, size: 24, alpha: 0.16 }
      ],
      furniture: [
        { kind: 'rug', x: 340, y: 245, w: 640, h: 455, color: '#f4bd55', accent: '#f9dfa0', pattern: 'dots', flat: true },
        { kind: 'rug', x: 1040, y: 690, w: 430, h: 280, color: '#7cc7e8', accent: '#c5eafa', pattern: 'waves', flat: true },
        { kind: 'sofa', x: 370, y: 64, w: 360, h: 122, color: '#7fae9a', pillow: '#f7d06b' },
        { kind: 'sideboard', x: 100, y: 74, w: 190, h: 68, color: '#a77451' },
        { kind: 'shelf', x: 56, y: 260, w: 72, h: 300, color: '#b98456', toys: true },
        { kind: 'coffeeTable', x: 530, y: 400, w: 230, h: 120, color: '#c58d5d' },
        { kind: 'pouf', x: 910, y: 490, w: 82, h: 74, color: '#ff9f7a' },
        { kind: 'slide', x: 1230, y: 220, w: 230, h: 180, color: '#7cc7e8' },
        { kind: 'ballpit', x: 1180, y: 690, w: 280, h: 230, color: '#ffd15c' },
        { kind: 'castle', x: 630, y: 800, w: 280, h: 150, color: '#d8a670' },
        { kind: 'toyChest', x: 100, y: 720, w: 180, h: 105, color: '#df8d55' },
        { kind: 'box', x: 1030, y: 720, w: 150, h: 120, color: '#b8926c' },
        { kind: 'box', x: 350, y: 270, w: 120, h: 100, color: '#c8a078' },
        { kind: 'box', x: 360, y: 760, w: 130, h: 105, color: '#d1a474' },
        { kind: 'box', x: 1010, y: 180, w: 120, h: 100, color: '#b8926c' },
        { kind: 'plant', x: 1460, y: 560, w: 78, h: 90, color: '#75b985' }
      ],
      tasks: [
        { type: 'blocks', x: 700, y: 300, gx: 700, gy: 300, label: 'Башня из кубиков' },
        { type: 'blocks', x: 942, y: 420, gx: 942, gy: 420, label: 'Ещё одна башня' },
        { type: 'ball', x: 820, y: 265, gx: 820, gy: 265, label: 'Полосатый мяч' },
        { type: 'plush', x: 470, y: 600, gx: 470, gy: 600, label: 'Зайка' },
        { type: 'books', x: 280, y: 620, gx: 280, gy: 620, label: 'Книжки' },
        { type: 'xylophone', x: 1080, y: 610, gx: 1080, gy: 610, label: 'Ксилофон' }
      ],
      seeds: [
        { x: 250, y: 190 },
        { x: 600, y: 750 },
        { x: 1405, y: 600 }
      ],
      words: [
        { en: 'toy', ru: 'игрушка', emoji: '🧸', x: 160, y: 640, sentence: 'This is a toy.', sentenceRu: 'Это игрушка.' },
        { en: 'box', ru: 'коробка', emoji: '📦', x: 520, y: 340, sentence: 'This is a box.', sentenceRu: 'Это коробка.' }
      ],
      hides: L1_HIDES,
      spawn: { x: 330, y: 880 },
      exit: { x: 1448, y: 60, w: 100, h: 72, label: 'норка' },
      enemies: [
        {
          type: 'cat', name: 'Мурка', x: 1360, y: 500, speed: 150, sight: 235,
          wakeAfter: 2, sleep: true,
          patrol: [[1240, 520], [980, 610], [930, 400], [1160, 290], [1370, 470]],
          phrases: { alert: 'Мяу!', lost: 'Мрр?', catch: 'Мурка догнала!' }
        }
      ],
      intro: {
        desc: 'В подвале — целая страна игрушек! Хома решил проверить, какие из них умеют летать. Мурка пока спит, но от шума она проснётся...',
        goals: ['Разбросай 6 игрушек', 'Собери 3 семечка', 'Доберись до норки наверху']
      }
    },

    {
      id: 2,
      place: 'ПЕРВЫЙ ЭТАЖ',
      name: 'Кухня и гостиная',
      short: 'Печенье, диван и мама',
      art: '🍪',
      cardColor: '#ffe3bd',
      world: { w: 2200, h: 1500 },
      floor: {
        base: '#e5b77a',
        zones: [
          { x: 36, y: 36, w: 1044, h: 894, style: 'wood', tone: '#e3b377' },
          { x: 1106, y: 36, w: 1058, h: 894, style: 'tile', tone: '#f3ddc1' },
          { x: 36, y: 956, w: 2128, h: 508, style: 'stone', tone: '#d8c4a9' }
        ]
      },
      walls: [
        { x: 0, y: 0, w: 2200, h: 36 },
        { x: 0, y: 1464, w: 2200, h: 36 },
        { x: 0, y: 0, w: 36, h: 1500 },
        { x: 2164, y: 0, w: 36, h: 1500 },
        { x: 1080, y: 36, w: 26, h: 384 },
        { x: 1080, y: 600, w: 26, h: 316 },
        { x: 36, y: 930, w: 224, h: 26 },
        { x: 540, y: 930, w: 960, h: 26 },
        { x: 1760, y: 930, w: 404, h: 26 }
      ],
      decor: [
        { type: 'window', x: 260, y: 0, w: 190, h: 36 },
        { type: 'window', x: 1270, y: 0, w: 150, h: 36 },
        { type: 'window', x: 1780, y: 0, w: 130, h: 36 },
        { type: 'door', x: 260, y: 930, w: 280, h: 26, kind: 'arch' },
        { type: 'door', x: 1500, y: 930, w: 260, h: 26, kind: 'arch' },
        { type: 'frontdoor', x: 1950, y: 1464, w: 150, h: 36 },
        { type: 'poster', x: 760, y: 38, w: 90, h: 58, text: 'СЕМЬЯ' }
      ],
      labels: [
        { text: 'ГОСТИНАЯ', x: 110, y: 280, size: 27, alpha: 0.15 },
        { text: 'КУХНЯ', x: 1160, y: 250, size: 28, alpha: 0.14 },
        { text: 'ПРИХОЖАЯ', x: 120, y: 1180, size: 25, alpha: 0.13 }
      ],
      furniture: [
        { kind: 'rug', x: 190, y: 300, w: 660, h: 460, color: '#e47d6d', accent: '#ffd0b5', pattern: 'diamonds', flat: true },
        { kind: 'rug', x: 240, y: 1050, w: 660, h: 350, color: '#8dae9e', accent: '#d4e7d7', pattern: 'stripes', flat: true },
        { kind: 'rug', x: 1230, y: 640, w: 540, h: 288, color: '#e7b36e', accent: '#f8dfb2', pattern: 'dots', flat: true },
        { kind: 'sofa', x: 180, y: 80, w: 370, h: 135, color: '#7e9f8d', pillow: '#ffcf6e' },
        { kind: 'armchair', x: 620, y: 110, w: 118, h: 118, color: '#d98b6c' },
        { kind: 'coffeeTable', x: 340, y: 395, w: 260, h: 130, color: '#b67e51' },
        { kind: 'bookshelf', x: 58, y: 560, w: 84, h: 280, color: '#a97750' },
        { kind: 'pouf', x: 690, y: 610, w: 78, h: 72, color: '#7cc7e8' },
        { kind: 'box', x: 480, y: 620, w: 120, h: 100, color: '#c8a078' },
        { kind: 'counter', x: 1120, y: 58, w: 440, h: 108, variant: 'sink', color: '#f5e6cf' },
        { kind: 'counter', x: 1560, y: 58, w: 310, h: 108, variant: 'stove', color: '#f5e6cf' },
        { kind: 'counter', x: 1870, y: 58, w: 270, h: 108, variant: 'plain', color: '#f5e6cf' },
        { kind: 'fridge', x: 2028, y: 185, w: 126, h: 230, color: '#e8f0e8' },
        { kind: 'island', x: 1400, y: 500, w: 360, h: 150, color: '#c69062' },
        { kind: 'diningTable', x: 1300, y: 700, w: 430, h: 160, color: '#c18857' },
        { kind: 'bench', x: 980, y: 1120, w: 270, h: 95, color: '#b9855a' },
        { kind: 'console', x: 1500, y: 1000, w: 280, h: 78, color: '#a9724b' },
        { kind: 'coatRack', x: 1850, y: 1020, w: 86, h: 86, color: '#5a4750' },
        { kind: 'plant', x: 300, y: 1330, w: 88, h: 96, color: '#75b985' },
        { kind: 'laundryBasket', x: 380, y: 1230, w: 92, h: 92, color: '#d9b07c' },
        { kind: 'box', x: 980, y: 1280, w: 120, h: 100, color: '#d1a474' },
        { kind: 'box', x: 1150, y: 800, w: 120, h: 100, color: '#b8926c' },
        { kind: 'wardrobe', x: 1730, y: 1120, w: 130, h: 280, color: '#a97750' }
      ],
      tasks: [
        { type: 'cereal', x: 1500, y: 240, gx: 1500, gy: 110, label: 'Хлопья' },
        { type: 'paper', x: 1910, y: 195, gx: 1910, gy: 108, label: 'Бумажные полотенца' },
        { type: 'plantTask', x: 880, y: 735, gx: 930, gy: 690, label: 'Цветок' },
        { type: 'cushion', x: 400, y: 245, gx: 400, gy: 125, label: 'Подушка с дивана' },
        { type: 'cookie', x: 1500, y: 895, gx: 1500, gy: 742, label: 'Печенье' },
        { type: 'books', x: 760, y: 760, gx: 760, gy: 760, label: 'Книги' }
      ],
      seeds: [
        { x: 880, y: 350 },
        { x: 1210, y: 690 },
        { x: 560, y: 1090 }
      ],
      words: [
        { en: 'kitchen', ru: 'кухня', emoji: '🍳', x: 1170, y: 300, sentence: 'This is a kitchen.', sentenceRu: 'Это кухня.' },
        { en: 'sofa', ru: 'диван', emoji: '🛋️', x: 260, y: 270, sentence: 'This is a sofa.', sentenceRu: 'Это диван.' }
      ],
      hides: [
        { x: 180, y: 80, w: 370, h: 135, ax: 560, ay: 245, px: 545, py: 155, label: 'за диваном' },
        { x: 1300, y: 700, w: 430, h: 160, ax: 1510, ay: 890, px: 1510, py: 760, label: 'под столом' },
        { x: 380, y: 1230, w: 92, h: 92, ax: 300, ay: 1280, px: 426, py: 1250, label: 'в корзине' },
        { x: 480, y: 620, w: 120, h: 100, ax: 450, ay: 670, px: 540, py: 670, label: 'в коробке' },
        { x: 980, y: 1280, w: 120, h: 100, ax: 950, ay: 1330, px: 1040, py: 1330, label: 'в коробке' },
        { x: 1150, y: 800, w: 120, h: 100, ax: 1210, ay: 770, px: 1210, py: 850, label: 'в коробке' },
        { x: 1730, y: 1120, w: 130, h: 280, ax: 1890, ay: 1240, px: 1795, py: 1200, label: 'в шкафу' }
      ],
      spawn: { x: 170, y: 830 },
      exit: { x: 2000, y: 1345, w: 112, h: 88, label: 'прихожая' },
      enemies: [
        {
          type: 'mom', name: 'Мама', x: 1680, y: 330, speed: 150, sight: 285,
          patrol: [[1680, 330], [1320, 330], [1200, 640], [930, 780], [700, 1100], [1600, 1160], [1900, 720]],
          phrases: { alert: 'Хома! Стой!', lost: 'Куда же он...', catch: 'Мама догнала!' }
        },
        {
          type: 'cat', name: 'Мурка', x: 600, y: 165, speed: 150, sight: 240,
          wakeAfter: 2, sleep: true,
          patrol: [[600, 230], [850, 300], [920, 620], [600, 820], [400, 1150], [900, 1230], [1350, 895]],
          phrases: { alert: 'Мяу!', lost: 'Мрр?', catch: 'Мурка догнала!' }
        },
        {
          type: 'vacuum', name: 'Робот-пылесос', x: 2100, y: 1010, speed: 118, sight: 235, fov: 1.05,
          activateAfter: 3,
          patrol: [[1980, 1030], [1450, 1040], [1100, 1080], [700, 1160], [1300, 1360], [1900, 1300]],
          phrases: { alert: 'Вжжж!', lost: 'Пип-пип?', catch: 'Робот засосал хвостик!' }
        }
      ],
      intro: {
        desc: 'На первом этаже пахнет печеньем. Мама на кухне, Мурка дремлет на диване, а робот-пылесос уже заряжается... Идеальный день для шалостей!',
        goals: ['Устрой 6 шалостей', 'Собери 3 семечка', 'Убеги в прихожую']
      }
    },

    {
      id: 3,
      place: 'ПЕРВЫЙ ЭТАЖ',
      name: 'Прихожая и гардероб',
      short: 'Ботинки, шарфы и робот',
      art: '🧦',
      cardColor: '#d9e8f7',
      world: { w: 2000, h: 1450 },
      floor: {
        base: '#d8c4a9',
        zones: [
          { x: 36, y: 36, w: 1180, h: 1378, style: 'stone', tone: '#d8c4a9' },
          { x: 1266, y: 206, w: 698, h: 804, style: 'wood', tone: '#c99362' }
        ]
      },
      walls: [
        { x: 0, y: 0, w: 2000, h: 36 },
        { x: 0, y: 1414, w: 2000, h: 36 },
        { x: 0, y: 0, w: 36, h: 1450 },
        { x: 1964, y: 0, w: 36, h: 1450 },
        { x: 1240, y: 180, w: 26, h: 320 },
        { x: 1240, y: 740, w: 26, h: 270 },
        { x: 1240, y: 180, w: 724, h: 26 },
        { x: 1240, y: 1010, w: 724, h: 26 }
      ],
      decor: [
        { type: 'window', x: 520, y: 0, w: 150, h: 36 },
        { type: 'window', x: 1400, y: 0, w: 150, h: 36 },
        { type: 'frontdoor', x: 520, y: 1414, w: 200, h: 36 },
        { type: 'door', x: 1240, y: 500, w: 26, h: 240, kind: 'arch' },
        { type: 'poster', x: 900, y: 38, w: 80, h: 54, text: 'ДОМ' }
      ],
      labels: [
        { text: 'ОГРОМНАЯ ПРИХОЖАЯ', x: 100, y: 240, size: 26, alpha: 0.14 },
        { text: 'ГАРДЕРОБНАЯ', x: 1330, y: 300, size: 21, alpha: 0.16 }
      ],
      furniture: [
        { kind: 'rug', x: 410, y: 470, w: 390, h: 720, color: '#c3665e', accent: '#f1c7a7', pattern: 'stripes', flat: true },
        { kind: 'stairs', x: 850, y: 50, w: 300, h: 190, color: '#b98a62', label: 'НАВЕРХ' },
        { kind: 'shoeRack', x: 56, y: 250, w: 92, h: 330, color: '#a97750' },
        { kind: 'shoeBench', x: 100, y: 640, w: 280, h: 95, color: '#b9855a' },
        { kind: 'console', x: 800, y: 760, w: 250, h: 80, color: '#a9724b' },
        { kind: 'mirror', x: 862, y: 600, w: 70, h: 136, color: '#e9d7a8' },
        { kind: 'coatRack', x: 1110, y: 450, w: 94, h: 94, color: '#5a4750' },
        { kind: 'bench', x: 650, y: 1110, w: 260, h: 92, color: '#b9855a' },
        { kind: 'box', x: 250, y: 920, w: 140, h: 120, color: '#c9a276' },
        { kind: 'box', x: 480, y: 400, w: 120, h: 100, color: '#d1a474' },
        { kind: 'laundryBasket', x: 1030, y: 1180, w: 94, h: 94, color: '#d9b07c' },
        { kind: 'plant', x: 160, y: 1180, w: 88, h: 96, color: '#75b985' },
        { kind: 'rail', x: 1320, y: 230, w: 500, h: 78, color: '#d1a06f', clothes: ['#e47d6d', '#7cc7e8', '#f4bd55', '#9bce9c', '#b7a1e8'] },
        { kind: 'box', x: 1720, y: 400, w: 120, h: 100, color: '#c8a078' },
        { kind: 'shelf', x: 1840, y: 300, w: 90, h: 280, color: '#b98456', scarves: true },
        { kind: 'dresser', x: 1450, y: 600, w: 200, h: 120, color: '#b98456' },
        { kind: 'wardrobe', x: 1680, y: 650, w: 200, h: 260, color: '#9d6e4b' },
        { kind: 'shoeBoxes', x: 1320, y: 820, w: 140, h: 110, color: '#d8b384' },
        { kind: 'mirror', x: 1880, y: 760, w: 74, h: 150, color: '#e9d7a8' }
      ],
      tasks: [
        { type: 'shoes', x: 190, y: 420, gx: 190, gy: 420, label: 'Кроссовки' },
        { type: 'shoes', x: 265, y: 545, gx: 265, gy: 545, label: 'Ботинки' },
        { type: 'shoes', x: 200, y: 800, gx: 200, gy: 800, label: 'Сапожки' },
        { type: 'shoes', x: 430, y: 900, gx: 430, gy: 900, label: 'Сандали' },
        { type: 'scarf', x: 1380, y: 390, gx: 1380, gy: 390, label: 'Шарф' },
        { type: 'scarf', x: 1600, y: 440, gx: 1600, gy: 440, label: 'Ещё шарф' },
        { type: 'sockBasket', x: 1600, y: 860, gx: 1600, gy: 860, label: 'Корзина носков' }
      ],
      seeds: [
        { x: 430, y: 300 },
        { x: 1700, y: 470 },
        { x: 360, y: 1200 }
      ],
      words: [
        { en: 'door', ru: 'дверь', emoji: '🚪', x: 620, y: 1300, sentence: 'This is a door.', sentenceRu: 'Это дверь.' },
        { en: 'shoe', ru: 'ботинок', emoji: '👟', x: 470, y: 600, sentence: 'This is a shoe.', sentenceRu: 'Это ботинок.' }
      ],
      hides: [
        { x: 100, y: 640, w: 280, h: 95, ax: 250, ay: 770, px: 240, py: 690, label: 'под скамейкой' },
        { x: 250, y: 920, w: 140, h: 120, ax: 410, ay: 980, px: 320, py: 962, label: 'в коробке' },
        { x: 480, y: 400, w: 120, h: 100, ax: 450, ay: 450, px: 540, py: 450, label: 'в коробке' },
        { x: 1720, y: 400, w: 120, h: 100, ax: 1690, ay: 450, px: 1780, py: 450, label: 'в коробке' },
        { x: 1030, y: 1180, w: 94, h: 94, ax: 970, ay: 1230, px: 1076, py: 1204, label: 'в корзине' },
        { x: 1680, y: 650, w: 200, h: 260, ax: 1780, ay: 930, px: 1780, py: 780, label: 'в шкафу' }
      ],
      spawn: { x: 330, y: 1260 },
      exit: { x: 1000, y: 258, w: 120, h: 84, label: 'наверх' },
      enemies: [
        {
          type: 'vacuum', name: 'Робот-пылесос', x: 1120, y: 1330, speed: 122, sight: 270, fov: 1.15,
          patrol: [[1120, 1330], [700, 1260], [300, 1100], [700, 800], [1000, 500], [700, 300], [1400, 500], [1600, 900], [1200, 1100]],
          phrases: { alert: 'Вжжж!', lost: 'Пип-пип?', catch: 'Робот засосал хвостик!' }
        },
        {
          type: 'mom', name: 'Мама', x: 780, y: 360, speed: 148, sight: 260,
          startDelay: 4,
          patrol: [[780, 360], [1050, 700], [700, 1000], [350, 850], [600, 500], [950, 1000]],
          phrases: { alert: 'Хома, что тут происходит?!', lost: 'Ну и где он?', catch: 'Мама догнала!' }
        },
        {
          type: 'cat', name: 'Мурка', x: 1500, y: 900, speed: 150, sight: 230,
          wakeAfter: 3, sleep: true,
          patrol: [[1540, 360], [1350, 700], [1600, 900], [1000, 900], [600, 1220], [1300, 1200]],
          phrases: { alert: 'Мяу!', lost: 'Мрр?', catch: 'Мурка догнала!' }
        }
      ],
      intro: {
        desc: 'В огромной прихожей столько ботинок и шарфов! А ещё тут катается робот-пылесос. Он очень не любит беспорядок. Прячься в шкафу, коробке или корзине!',
        goals: ['Разбросай 4 пары обуви', 'Запутай 2 шарфа и носки', 'Юркни на лестницу']
      }
    },

    {
      id: 4,
      place: 'ВТОРОЙ ЭТАЖ',
      name: 'Три спальни',
      short: 'Подушки, одеяла и финал',
      art: '🛏️',
      cardColor: '#e6dcff',
      world: { w: 2300, h: 1600 },
      floor: {
        base: '#b9c9d9',
        zones: [
          { x: 36, y: 36, w: 724, h: 664, style: 'carpet', tone: '#e7d6e9' },
          { x: 784, y: 36, w: 756, h: 664, style: 'carpet', tone: '#f3d9bf' },
          { x: 1564, y: 36, w: 700, h: 664, style: 'carpet', tone: '#d4ebdf' },
          { x: 36, y: 724, w: 2228, h: 840, style: 'runner', tone: '#c2d1df' }
        ]
      },
      walls: [
        { x: 0, y: 0, w: 2300, h: 36 },
        { x: 0, y: 1564, w: 2300, h: 36 },
        { x: 0, y: 0, w: 36, h: 1600 },
        { x: 2264, y: 0, w: 36, h: 1600 },
        { x: 760, y: 36, w: 24, h: 664 },
        { x: 1540, y: 36, w: 24, h: 664 },
        { x: 36, y: 700, w: 264, h: 24 },
        { x: 420, y: 700, w: 630, h: 24 },
        { x: 1170, y: 700, w: 680, h: 24 },
        { x: 1970, y: 700, w: 294, h: 24 }
      ],
      decor: [
        { type: 'window', x: 200, y: 0, w: 160, h: 36 },
        { type: 'window', x: 980, y: 0, w: 180, h: 36 },
        { type: 'window', x: 1740, y: 0, w: 160, h: 36 },
        { type: 'door', x: 300, y: 700, w: 120, h: 24, kind: 'open' },
        { type: 'door', x: 1050, y: 700, w: 120, h: 24, kind: 'open' },
        { type: 'door', x: 1850, y: 700, w: 120, h: 24, kind: 'open' },
        { type: 'poster', x: 630, y: 38, w: 90, h: 54, text: '★' }
      ],
      labels: [
        { text: 'ДЕТСКАЯ', x: 70, y: 330, size: 23, alpha: 0.17 },
        { text: 'РОДИТЕЛЬСКАЯ', x: 820, y: 330, size: 23, alpha: 0.15 },
        { text: 'ГОСТЕВАЯ', x: 1600, y: 330, size: 23, alpha: 0.15 },
        { text: 'КОРИДОР', x: 90, y: 1060, size: 23, alpha: 0.13 }
      ],
      furniture: [
        { kind: 'rug', x: 350, y: 170, w: 330, h: 340, color: '#b7a1e8', accent: '#eadffb', pattern: 'stars', flat: true },
        { kind: 'rug', x: 900, y: 300, w: 360, h: 300, color: '#e8a37d', accent: '#ffdfc4', pattern: 'diamonds', flat: true },
        { kind: 'rug', x: 1640, y: 260, w: 340, h: 300, color: '#8fcaae', accent: '#d9f1e3', pattern: 'dots', flat: true },
        { kind: 'rug', x: 220, y: 880, w: 1860, h: 280, color: '#5d7590', accent: '#8ba2bb', pattern: 'stripes', flat: true },
        { kind: 'bed', x: 90, y: 70, w: 240, h: 330, color: '#b7a1e8', pillow: '#fff3d0' },
        { kind: 'box', x: 380, y: 80, w: 110, h: 90, color: '#c8a078' },
        { kind: 'desk', x: 560, y: 70, w: 150, h: 95, color: '#bf8c61' },
        { kind: 'chair', x: 600, y: 190, w: 64, h: 64, color: '#e8a37d' },
        { kind: 'toyShelf', x: 510, y: 500, w: 190, h: 95, color: '#b98456' },
        { kind: 'bed', x: 900, y: 70, w: 300, h: 360, color: '#e8a37d', pillow: '#fff3d0' },
        { kind: 'wardrobe', x: 1370, y: 80, w: 160, h: 260, color: '#9d6e4b' },
        { kind: 'dresser', x: 800, y: 500, w: 200, h: 90, color: '#b98456' },
        { kind: 'box', x: 1260, y: 380, w: 120, h: 90, color: '#d1a474' },
        { kind: 'armchair', x: 1240, y: 480, w: 110, h: 110, color: '#7e9f8d' },
        { kind: 'sofa', x: 1650, y: 80, w: 310, h: 135, color: '#6f9f8b', pillow: '#ffd15c' },
        { kind: 'box', x: 1720, y: 600, w: 120, h: 90, color: '#b8926c' },
        { kind: 'chest', x: 1850, y: 480, w: 130, h: 110, color: '#a97750' },
        { kind: 'plant', x: 1590, y: 520, w: 84, h: 94, color: '#75b985' },
        { kind: 'nest', x: 2070, y: 560, w: 140, h: 100, color: '#d9a45f' },
        { kind: 'console', x: 980, y: 1370, w: 300, h: 78, color: '#a9724b' },
        { kind: 'box', x: 1600, y: 1150, w: 120, h: 100, color: '#c8a078' },
        { kind: 'laundryBasket', x: 1100, y: 1240, w: 94, h: 94, color: '#d9b07c' },
        { kind: 'plant', x: 80, y: 1180, w: 88, h: 96, color: '#75b985' },
        { kind: 'plant', x: 2160, y: 1130, w: 88, h: 96, color: '#75b985' },
        { kind: 'vacuumDock', x: 300, y: 1450, w: 90, h: 56, color: '#5a596b' },
        { kind: 'catBed', x: 430, y: 860, w: 120, h: 84, color: '#d98b6c' }
      ],
      tasks: [
        { type: 'pillow', x: 210, y: 440, gx: 210, gy: 140, label: 'Подушка в детской' },
        { type: 'toys', x: 560, y: 620, gx: 560, gy: 620, label: 'Игрушки' },
        { type: 'sock', x: 700, y: 380, gx: 700, gy: 380, label: 'Носок' },
        { type: 'slipper', x: 850, y: 620, gx: 850, gy: 620, label: 'Тапок' },
        { type: 'blanket', x: 1050, y: 470, gx: 1050, gy: 210, label: 'Одеяло' },
        { type: 'cushion', x: 1800, y: 260, gx: 1800, gy: 135, label: 'Подушка с дивана' },
        { type: 'plush', x: 2215, y: 370, gx: 2215, gy: 370, label: 'Плюшевый мишка' }
      ],
      seeds: [
        { x: 470, y: 640 },
        { x: 1420, y: 520 },
        { x: 1700, y: 620 }
      ],
      words: [
        { en: 'bed', ru: 'кровать', emoji: '🛏️', x: 430, y: 430, sentence: 'This is a bed.', sentenceRu: 'Это кровать.' },
        { en: 'pillow', ru: 'подушка', emoji: '🛌', x: 1900, y: 300, sentence: 'This is a pillow.', sentenceRu: 'Это подушка.' }
      ],
      hides: [
        { x: 90, y: 70, w: 240, h: 330, ax: 210, ay: 470, px: 210, py: 370, label: 'под кроватью' },
        { x: 900, y: 70, w: 300, h: 360, ax: 1060, ay: 500, px: 1060, py: 400, label: 'под кроватью' },
        { x: 1370, y: 80, w: 160, h: 260, ax: 1440, ay: 400, px: 1450, py: 320, label: 'в шкафу' },
        { x: 380, y: 80, w: 110, h: 90, ax: 350, ay: 125, px: 435, py: 125, label: 'в коробке' },
        { x: 1260, y: 380, w: 120, h: 90, ax: 1230, ay: 425, px: 1320, py: 425, label: 'в коробке' },
        { x: 1720, y: 600, w: 120, h: 90, ax: 1690, ay: 645, px: 1780, py: 645, label: 'в коробке' },
        { x: 1600, y: 1150, w: 120, h: 100, ax: 1570, ay: 1200, px: 1660, py: 1200, label: 'в коробке' },
        { x: 1850, y: 480, w: 130, h: 110, ax: 1815, ay: 560, px: 1915, py: 530, label: 'в сундуке' },
        { x: 1100, y: 1240, w: 94, h: 94, ax: 1040, ay: 1290, px: 1146, py: 1264, label: 'в корзине' }
      ],
      spawn: { x: 220, y: 1250 },
      exit: { x: 2080, y: 560, w: 120, h: 90, label: 'гнездо' },
      enemies: [
        {
          type: 'mom', name: 'Мама', x: 1100, y: 640, speed: 150, sight: 285,
          patrol: [[900, 650], [850, 850], [500, 1150], [950, 1250], [1400, 1000], [1500, 750], [1100, 600]],
          phrases: { alert: 'Хома! Ты почему не спишь?', lost: 'Хома, ты где?', catch: 'Мама догнала!' }
        },
        {
          type: 'cat', name: 'Мурка', x: 620, y: 980, speed: 150, sight: 235,
          wakeAfter: 2, sleep: true,
          patrol: [[430, 980], [600, 1220], [1300, 1250], [1900, 1200], [1600, 900], [800, 900]],
          phrases: { alert: 'Мяу!', lost: 'Мрр?', catch: 'Мурка догнала!' }
        },
        {
          type: 'vacuum', name: 'Робот-пылесос', x: 1900, y: 1450, speed: 122, sight: 255, fov: 1.1,
          patrol: [[1900, 1450], [1500, 1460], [900, 1440], [450, 1450], [900, 1370], [1700, 1400]],
          phrases: { alert: 'Вжжж!', lost: 'Пип-пип?', catch: 'Робот засосал хвостик!' }
        }
      ],
      intro: {
        desc: 'Три спальни, три одеяла и один очень шустрый хомяк. Осталось устроить самое уютное гнездо в гостевой комнате. Только не попадись маме!',
        goals: ['Устрой бардак в 3 спальнях', 'Собери 3 семечка', 'Спрячься в гнезде']
      }
    }
  ];
})();
