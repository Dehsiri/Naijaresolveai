import type {
  LocationDef,
  ActionDef,
  ItemDef,
  NpcDef,
  MissionDef,
  EventDef,
} from '@warri-vibe/engine';

import locationsData from '../data/locations.json' with { type: 'json' };
import actionsData from '../data/actions.json' with { type: 'json' };
import itemsData from '../data/items.json' with { type: 'json' };
import npcsData from '../data/npcs.json' with { type: 'json' };
import missionsData from '../data/missions.json' with { type: 'json' };
import eventsData from '../data/events.json' with { type: 'json' };

export interface ContentBundle {
  locations: LocationDef[];
  actions: ActionDef[];
  items: ItemDef[];
  npcs: NpcDef[];
  missions: MissionDef[];
  events: EventDef[];
}

export function validateContent(bundle: ContentBundle): { valid: boolean; errors: string[]; draftCount: number } {
  const errors: string[] = [];
  let draftCount = 0;

  // Check unique location IDs
  const locationIds = new Set<string>();
  for (const loc of bundle.locations) {
    if (!loc.id) errors.push('Location missing id.');
    if (locationIds.has(loc.id)) errors.push(`Duplicate location id: ${loc.id}`);
    locationIds.add(loc.id);
    if (loc.reviewStatus === 'draft') draftCount++;
  }

  // Check unique NPC IDs
  const npcIds = new Set<string>();
  for (const npc of bundle.npcs) {
    if (!npc.id) errors.push('NPC missing id.');
    if (npcIds.has(npc.id)) errors.push(`Duplicate NPC id: ${npc.id}`);
    npcIds.add(npc.id);
    if (npc.home && !locationIds.has(npc.home)) {
      errors.push(`NPC ${npc.id} references unknown home location: ${npc.home}`);
    }
    if (npc.reviewStatus === 'draft') draftCount++;
  }

  // Check unique Item IDs
  const itemIds = new Set<string>();
  for (const item of bundle.items) {
    if (!item.id) errors.push('Item missing id.');
    if (itemIds.has(item.id)) errors.push(`Duplicate item id: ${item.id}`);
    itemIds.add(item.id);
    if (item.price < 0) errors.push(`Item ${item.id} has negative price.`);
    if (item.reviewStatus === 'draft') draftCount++;
  }

  // Check unique Action IDs and valid references
  const actionIds = new Set<string>();
  for (const act of bundle.actions) {
    if (!act.id) errors.push('Action missing id.');
    if (actionIds.has(act.id)) errors.push(`Duplicate action id: ${act.id}`);
    actionIds.add(act.id);
    if (!locationIds.has(act.location)) {
      errors.push(`Action ${act.id} references unknown location: ${act.location}`);
    }
    if (act.money && act.money[0] > act.money[1]) {
      errors.push(`Action ${act.id} has invalid money range [${act.money[0]}, ${act.money[1]}]`);
    }
    if (act.affinity) {
      for (const npcId of Object.keys(act.affinity)) {
        if (!npcIds.has(npcId)) {
          errors.push(`Action ${act.id} references unknown NPC: ${npcId}`);
        }
      }
    }
    if (act.reviewStatus === 'draft') draftCount++;
  }

  // Check unique Mission IDs
  const missionIds = new Set<string>();
  for (const m of bundle.missions) {
    if (!m.id) errors.push('Mission missing id.');
    if (missionIds.has(m.id)) errors.push(`Duplicate mission id: ${m.id}`);
    missionIds.add(m.id);
    if (m.trigger.location && !locationIds.has(m.trigger.location)) {
      errors.push(`Mission ${m.id} references unknown location: ${m.trigger.location}`);
    }
    if (m.reviewStatus === 'draft') draftCount++;
  }

  // Check Events
  const eventIds = new Set<string>();
  for (const ev of bundle.events) {
    if (!ev.id) errors.push('Event missing id.');
    if (eventIds.has(ev.id)) errors.push(`Duplicate event id: ${ev.id}`);
    eventIds.add(ev.id);
    if (ev.location && !locationIds.has(ev.location)) {
      errors.push(`Event ${ev.id} references unknown location: ${ev.location}`);
    }
    if (ev.reviewStatus === 'draft') draftCount++;
  }

  return {
    valid: errors.length === 0,
    errors,
    draftCount,
  };
}

let cachedContent: ContentBundle | null = null;

export function loadContent(): ContentBundle {
  if (cachedContent) return cachedContent;

  const bundle: ContentBundle = {
    locations: locationsData as LocationDef[],
    actions: actionsData as ActionDef[],
    items: itemsData as ItemDef[],
    npcs: npcsData as NpcDef[],
    missions: missionsData as MissionDef[],
    events: eventsData as EventDef[],
  };

  const validation = validateContent(bundle);
  if (!validation.valid) {
    throw new Error(`Content validation failed:\n${validation.errors.join('\n')}`);
  }

  if (validation.draftCount > 0 && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    // console.info(`[Content Notice] Loaded ${validation.draftCount} text elements with reviewStatus="draft".`);
  }

  cachedContent = bundle;
  return bundle;
}
