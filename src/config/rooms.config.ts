import type { CustomPropPlacement, PropPlacement, RoomDefinition, RoomNpc } from '@/types/engine.types';

// Coordinates are normalized to each room's own origin (top-left corner),
// derived from the composed scene rects in public/sprites/manifest.json.

const cafeProps: PropPlacement[] = [
  { name: 'wall-window', x: 48, y: 39 },
  { name: 'wall-clock', x: 170, y: 32 },
  { name: 'wall-art', x: 220, y: 42 },
  { name: 'counter', x: 56, y: 102 },
  { name: 'counter', x: 104, y: 102 },
  { name: 'espresso-machine', x: 49, y: 82 },
  { name: 'pastry-case', x: 106, y: 82 },
  { name: 'kitchen-cabinet', x: 191, y: 71 },
  { name: 'fridge', x: 227, y: 77 },
  { name: 'plant-large', x: 18, y: 110 },
  { name: 'bar-stool', x: 58, y: 131 },
  { name: 'bar-stool', x: 104, y: 131 },
  { name: 'cafe-table', x: 53, y: 206 },
  { name: 'cafe-chair', x: 27, y: 198 },
  { name: 'cafe-chair', x: 82, y: 198 },
  { name: 'cafe-table', x: 176, y: 207 },
  { name: 'cafe-chair', x: 150, y: 199 },
  { name: 'cafe-chair', x: 205, y: 199 },
  { name: 'sofa', x: 61, y: 310 },
  { name: 'coffee-table', x: 62, y: 330 },
  { name: 'armchair', x: 184, y: 311 },
  { name: 'plant-large', x: 225, y: 330 },
];

const cafeCustomProps: CustomPropPlacement[] = [
  {
    id: 'cafe-menu-board',
    image: '/assets/added/fooddrink/Tiles/CafeFixtures/fooddrink_cafe_fixtures_menu_board_easel_blank_01.png',
    x: 160, y: 118, width: 38, height: 50, anchorX: 19, anchorY: 45,
    collision: { x: 150, y: 104, w: 20, h: 12 },
  },
  {
    id: 'cafe-cake-display',
    image: '/assets/added/fooddrink/Tiles/CafeFixtures/fooddrink_cafe_fixtures_cake_display_case_curved_01.png',
    x: 128, y: 110, width: 52, height: 52, anchorX: 26, anchorY: 46,
    collision: { x: 108, y: 96, w: 40, h: 14 },
  },
  {
    id: 'cafe-donut-tray',
    image: '/assets/added/fooddrink/Tiles/CafeProps/fooddrink_cafe_props_donut_tray_01.png',
    x: 86, y: 92, width: 28, height: 18, anchorX: 14, anchorY: 14, passable: true,
  },
  {
    id: 'cafe-sugar-creamer',
    image: '/assets/added/fooddrink/Tiles/CafeProps/fooddrink_cafe_props_sugar_creamer_pair_01.png',
    x: 70, y: 92, width: 18, height: 20, anchorX: 9, anchorY: 16, passable: true,
  },
  {
    id: 'cafe-takeaway-cups',
    image: '/assets/added/fooddrink/Tiles/CafeProps/fooddrink_cafe_props_takeaway_cups_stack_01.png',
    x: 40, y: 92, width: 14, height: 24, anchorX: 7, anchorY: 20, passable: true,
  },
  {
    id: 'cafe-string-lights',
    image: '/assets/added/fooddrink/Tiles/CafeProps/fooddrink_cafe_props_string_lights_warm_segment_01.png',
    x: 128, y: 48, width: 120, height: 30, anchorX: 60, anchorY: 15, passable: true,
  },
];

const cafeNpcs: RoomNpc[] = [
  { id: 'cafe-cook', name: 'Cook', slug: 'cook', x: 80, y: 86, direction: 'south', interactionRadius: 34, action: 'menu' },
];

const apartmentProps: PropPlacement[] = [
  { name: 'wall-window', x: 188, y: 33 },
  { name: 'wall-art', x: 107, y: 32 },
  { name: 'bed', x: 41, y: 87 },
  { name: 'nightstand', x: 76, y: 75 },
  { name: 'floor-lamp', x: 83, y: 65 },
  { name: 'wardrobe', x: 124, y: 75 },
  { name: 'sink', x: 171, y: 67 },
  { name: 'stove', x: 204, y: 67 },
  { name: 'fridge', x: 246, y: 72 },
  { name: 'rug', x: 179, y: 127 },
  { name: 'plant-small', x: 139, y: 97 },
];

const workspaceProps: PropPlacement[] = [
  { name: 'wall-window', x: 67, y: 33 },
  { name: 'wall-art', x: 174, y: 32 },
  { name: 'bookcase', x: 241, y: 68 },
  { name: 'printer', x: 17, y: 47 },
  { name: 'filing-cabinet', x: 17, y: 76 },
  { name: 'desk', x: 73, y: 89 },
  { name: 'desk', x: 145, y: 89 },
  { name: 'computer', x: 72, y: 68 },
  { name: 'computer', x: 142, y: 68 },
  { name: 'office-chair', x: 73, y: 113 },
  { name: 'office-chair', x: 142, y: 113 },
  { name: 'water-cooler', x: 205, y: 82 },
  { name: 'parcel-stack', x: 222, y: 158 },
  { name: 'toolbox', x: 15, y: 162 },
  { name: 'plant-large', x: 259, y: 152 },
];

const barCustomProps: CustomPropPlacement[] = [
  {
    id: 'bar-counter',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_bar_counter_straight_01.png',
    x: 96, y: 112, width: 90, height: 82, anchorX: 45, anchorY: 72,
    collision: { x: 56, y: 88, w: 80, h: 22 },
  },
  {
    id: 'bar-shelf',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_back_bar_shelf_bottles_01.png',
    x: 96, y: 64, width: 70, height: 88, anchorX: 35, anchorY: 82,
    collision: { x: 64, y: 44, w: 64, h: 16 },
  },
  {
    id: 'bar-taps',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_beer_tap_tower_01.png',
    x: 96, y: 90, width: 34, height: 36, anchorX: 17, anchorY: 30, passable: true,
  },
  {
    id: 'bar-stools',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_stool_bar_metal_row_01.png',
    x: 96, y: 148, width: 84, height: 48, anchorX: 42, anchorY: 40, passable: true,
  },
  {
    id: 'bar-table',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_table_high_round_01.png',
    x: 210, y: 190, width: 54, height: 66, anchorX: 27, anchorY: 58,
    collision: { x: 192, y: 168, w: 36, h: 20 },
  },
  {
    id: 'bar-jukebox',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_jukebox_01.png',
    x: 38, y: 210, width: 36, height: 52, anchorX: 18, anchorY: 46,
    collision: { x: 24, y: 192, w: 28, h: 16 },
  },
  {
    id: 'bar-neon',
    image: '/assets/added/fooddrink/Tiles/BarFixtures/fooddrink_bar_fixtures_neon_frame_blank_01.png',
    x: 210, y: 56, width: 56, height: 40, anchorX: 28, anchorY: 20, passable: true,
  },
  {
    id: 'bar-menu',
    image: '/assets/added/fooddrink/Tiles/BarProps/fooddrink_bar_props_drink_menu_stand_blank_01.png',
    x: 150, y: 120, width: 24, height: 32, anchorX: 12, anchorY: 28, passable: true,
  },
];

const barNpcs: RoomNpc[] = [
  { id: 'bar-cook', name: 'Cook', slug: 'cook', x: 96, y: 78, direction: 'south', interactionRadius: 36, action: 'menu' },
];

const restaurantCustomProps: CustomPropPlacement[] = [
  {
    id: 'restaurant-counter',
    image: '/assets/added/fooddrink/Tiles/RestaurantFixtures/fooddrink_restaurant_fixtures_open_kitchen_display_counter_01.png',
    x: 136, y: 108, width: 110, height: 90, anchorX: 55, anchorY: 78,
    collision: { x: 86, y: 82, w: 100, h: 24 },
  },
  {
    id: 'restaurant-host',
    image: '/assets/added/fooddrink/Tiles/RestaurantFixtures/fooddrink_restaurant_fixtures_host_stand_podium_01.png',
    x: 38, y: 250, width: 34, height: 46, anchorX: 17, anchorY: 40,
    collision: { x: 24, y: 234, w: 28, h: 14 },
  },
  {
    id: 'restaurant-table-left',
    image: '/assets/added/fooddrink/Tiles/RestaurantFixtures/fooddrink_restaurant_fixtures_table_dining_square_four_01.png',
    x: 72, y: 190, width: 74, height: 68, anchorX: 37, anchorY: 58,
    collision: { x: 44, y: 164, w: 56, h: 22 },
  },
  {
    id: 'restaurant-table-right',
    image: '/assets/added/fooddrink/Tiles/RestaurantFixtures/fooddrink_restaurant_fixtures_table_dining_round_four_01.png',
    x: 200, y: 190, width: 74, height: 66, anchorX: 37, anchorY: 56,
    collision: { x: 172, y: 164, w: 56, h: 22 },
  },
  {
    id: 'restaurant-table-window',
    image: '/assets/added/fooddrink/Tiles/RestaurantFixtures/fooddrink_restaurant_fixtures_table_window_two_01.png',
    x: 136, y: 285, width: 70, height: 60, anchorX: 35, anchorY: 50,
    collision: { x: 108, y: 262, w: 56, h: 20 },
  },
  {
    id: 'restaurant-menu',
    image: '/assets/added/fooddrink/Tiles/RestaurantProps/fooddrink_restaurant_props_menu_book_blank_01.png',
    x: 176, y: 118, width: 22, height: 16, anchorX: 11, anchorY: 12, passable: true,
  },
  {
    id: 'restaurant-plant',
    image: '/assets/added/fooddrink/Tiles/CafeProps/fooddrink_cafe_props_vase_single_flower_01.png',
    x: 240, y: 250, width: 18, height: 36, anchorX: 9, anchorY: 32, passable: true,
  },
];

const restaurantNpcs: RoomNpc[] = [
  { id: 'restaurant-cook', name: 'Cook', slug: 'cook', x: 136, y: 74, direction: 'south', interactionRadius: 36, action: 'menu' },
];

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    id: 'public-cafe',
    name: 'Café',
    width: 256,
    height: 352,
    floorTile: 'cream-tile',
    wallTile: 'wall-sage',
    spawn: { x: 128, y: 300 },
    seats: [
      { id: 'cafe-bar-a', propName: 'bar-stool', x: 58, y: 131, facing: 'south' },
      { id: 'cafe-bar-b', propName: 'bar-stool', x: 104, y: 131, facing: 'south' },
      { id: 'cafe-chair-a', propName: 'cafe-chair', x: 27, y: 198, facing: 'south' },
      { id: 'cafe-chair-b', propName: 'cafe-chair', x: 82, y: 198, facing: 'south' },
      { id: 'cafe-chair-c', propName: 'cafe-chair', x: 150, y: 199, facing: 'south' },
      { id: 'cafe-chair-d', propName: 'cafe-chair', x: 205, y: 199, facing: 'south' },
      { id: 'cafe-sofa', propName: 'sofa', x: 61, y: 310, facing: 'north' },
      { id: 'cafe-armchair', propName: 'armchair', x: 184, y: 311, facing: 'north' },
    ],
    props: cafeProps,
    customProps: cafeCustomProps,
    npcs: cafeNpcs,
    blockedRects: [],
  },
  {
    id: 'public-apartment',
    name: 'Apartment',
    width: 272,
    height: 160,
    floorTile: 'oak-floor',
    wallTile: 'wall-cream',
    spawn: { x: 136, y: 120 },
    seats: [],
    props: apartmentProps,
    blockedRects: [],
  },
  {
    id: 'public-workspace',
    name: 'Office',
    width: 272,
    height: 176,
    floorTile: 'carpet',
    wallTile: 'wall-cream',
    spawn: { x: 136, y: 140 },
    seats: [
      { id: 'workspace-chair-a', propName: 'office-chair', x: 73, y: 113, facing: 'south' },
      { id: 'workspace-chair-b', propName: 'office-chair', x: 142, y: 113, facing: 'south' },
    ],
    props: workspaceProps,
    blockedRects: [],
  },
  {
    id: 'public-bar',
    name: 'Bar',
    width: 272,
    height: 256,
    floorTile: 'slate-tile',
    wallTile: 'wall-cream',
    spawn: { x: 136, y: 220 },
    seats: [
      { id: 'bar-stool-a', propName: 'bar-stool', x: 64, y: 148, facing: 'south' },
      { id: 'bar-stool-b', propName: 'bar-stool', x: 96, y: 148, facing: 'south' },
      { id: 'bar-stool-c', propName: 'bar-stool', x: 128, y: 148, facing: 'south' },
      { id: 'bar-table-seat', propName: 'table', x: 210, y: 190, facing: 'north' },
    ],
    props: [],
    customProps: barCustomProps,
    npcs: barNpcs,
    blockedRects: [],
  },
  {
    id: 'public-restaurant',
    name: 'Restaurant',
    width: 272,
    height: 320,
    floorTile: 'oak-floor',
    wallTile: 'wall-cream',
    spawn: { x: 136, y: 286 },
    seats: [
      { id: 'restaurant-left-a', propName: 'table', x: 56, y: 190, facing: 'south' },
      { id: 'restaurant-left-b', propName: 'table', x: 88, y: 190, facing: 'south' },
      { id: 'restaurant-right-a', propName: 'table', x: 184, y: 190, facing: 'south' },
      { id: 'restaurant-right-b', propName: 'table', x: 216, y: 190, facing: 'south' },
      { id: 'restaurant-window-a', propName: 'table', x: 120, y: 285, facing: 'north' },
      { id: 'restaurant-window-b', propName: 'table', x: 152, y: 285, facing: 'north' },
    ],
    props: [],
    customProps: restaurantCustomProps,
    npcs: restaurantNpcs,
    blockedRects: [],
  },
];

export const PUBLIC_ROOMS = ROOM_DEFINITIONS.filter((room) => room.id.startsWith('public-'));

export function roomDefinition(roomId: string): RoomDefinition {
  const definition = ROOM_DEFINITIONS.find((room) => room.id === roomId);
  if (!definition) {
    throw new Error(`Unknown room: ${roomId}`);
  }
  return definition;
}

export function bedroomRoomId(userId: string): string {
  return `bedroom-${userId}`;
}

export function isBedroomRoom(roomId: string): boolean {
  return roomId.startsWith('bedroom-');
}

export function bedroomOwnerId(roomId: string): string | null {
  if (!isBedroomRoom(roomId)) return null;
  return roomId.slice('bedroom-'.length) || null;
}

export function getBedroomDefinition(ownerId: string): RoomDefinition {
  const roomId = bedroomRoomId(ownerId);
  return {
    id: roomId,
    name: 'My Room',
    width: 200,
    height: 200,
    floorTile: 'oak-floor',
    wallTile: 'wall-cream',
    backgroundImage: '/assets/added/pixel-interiors/tiles-and-items.png',
    spawn: { x: 100, y: 168 },
    seats: [
      { id: `${roomId}-bed`, propName: 'bed', x: 56, y: 92, facing: 'south' },
      { id: `${roomId}-seat`, propName: 'chair', x: 150, y: 118, facing: 'south' },
    ],
    props: [],
    customProps: [],
    npcs: [],
    blockedRects: [
      { x: 0, y: 0, w: 200, h: 16 },
      { x: 0, y: 184, w: 200, h: 16 },
      { x: 0, y: 0, w: 14, h: 200 },
      { x: 186, y: 0, w: 14, h: 200 },
    ],
  };
}

/**
 * Private rooms have no authored layout, so they reuse the Café shell under
 * their own id/name. Personal bedrooms use the Pixel interiors layout.
 */
export function resolveRoomDefinition(roomId: string): RoomDefinition {
  const known = ROOM_DEFINITIONS.find((room) => room.id === roomId);
  if (known) return known;

  if (isBedroomRoom(roomId)) {
    return getBedroomDefinition(bedroomOwnerId(roomId) ?? '');
  }

  const cafe = ROOM_DEFINITIONS[0];
  return {
    ...cafe,
    id: roomId,
    name: 'Private Room',
    seats: cafe.seats.map((seat) => ({ ...seat, id: `${roomId}:${seat.id}` })),
  };
}

export function isPublicRoom(roomId: string): boolean {
  return PUBLIC_ROOMS.some((room) => room.id === roomId);
}
