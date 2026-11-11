import { Card, Direction, Vulnerability, Suit, Rank, createCard, sortHand } from '../logic/bridgeRules';
import { Deal } from '../types/bridge';

/**
 * Parses cards from PBN format (e.g. "AKJ.Q98.765.432") into Card array.
 * PBN suit order is: Spades, Hearts, Diamonds, Clubs separated by dots.
 */
export function parsePbnHand(handStr: string): Card[] {
  const parts = handStr.trim().split('.');
  if (parts.length !== 4) return [];

  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const cards: Card[] = [];

  for (let i = 0; i < 4; i++) {
    const suit = suits[i];
    const ranks = parts[i].toUpperCase().replace(/\s+/g, '');
    for (const ch of ranks) {
      let rank: Rank | null = null;
      if ('AKQJT98765432'.includes(ch)) {
        rank = (ch === '1' ? 'T' : ch) as Rank;
      }
      if (rank) {
        cards.push(createCard(suit, rank));
      }
    }
  }

  return sortHand(cards);
}

/**
 * Converts a 13-card hand into PBN dot notation: "AKJ.Q98.765.432"
 */
export function formatPbnHand(hand: Card[]): string {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const rankChars: Record<Suit, string[]> = { S: [], H: [], D: [], C: [] };

  hand.forEach(c => {
    rankChars[c.suit].push(c.rank === 'T' ? 'T' : c.rank);
  });

  return suits.map(s => rankChars[s].join('') || '-').join('.');
}

/**
 * Parses full PBN deal tag: e.g. "N:AK.QJT.987.AKQJ 98.765.654.9876 ..."
 * Order of hands follows clockwise starting from the indicated first player.
 */
export function parsePbnDeal(dealTag: string): Record<Direction, Card[]> | null {
  const clean = dealTag.replace(/["\[\]]/g, '').trim();
  const colonIdx = clean.indexOf(':');
  if (colonIdx === -1) return null;

  const firstDir = clean.substring(0, colonIdx).trim().toUpperCase() as Direction;
  if (!['N', 'E', 'S', 'W'].includes(firstDir)) return null;

  const handsStr = clean.substring(colonIdx + 1).trim().split(/\s+/);
  if (handsStr.length !== 4) return null;

  const dirs: Direction[] = ['N', 'E', 'S', 'W'];
  const startIdx = dirs.indexOf(firstDir);

  const result: Partial<Record<Direction, Card[]>> = {};

  for (let i = 0; i < 4; i++) {
    const currentDir = dirs[(startIdx + i) % 4];
    result[currentDir] = parsePbnHand(handsStr[i]);
  }

  return result as Record<Direction, Card[]>;
}

/**
 * Serializes a Deal into PBN text for sharing, backup, or copying.
 */
export function exportToPbn(deal: Deal): string {
  const n = formatPbnHand(deal.hands.N);
  const e = formatPbnHand(deal.hands.E);
  const s = formatPbnHand(deal.hands.S);
  const w = formatPbnHand(deal.hands.W);

  const lines = [
    `% PBN 2.1 exported from Bridge Master Studio`,
    `[Event "${deal.title || 'Lekcja brydża'}"]`,
    `[Site "Bridge Master - Studio Nauki"]`,
    `[Date "${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}"]`,
    `[Board "${deal.id}"]`,
    `[Dealer "${deal.dealer}"]`,
    `[Vulnerable "${deal.vulnerability}"]`,
    `[Deal "N:${n} ${e} ${s} ${w}"]`,
  ];

  if (deal.targetContract) {
    lines.push(`[Declarer "${deal.targetContract.declarer}"]`);
    lines.push(`[Contract "${deal.targetContract.level}${deal.targetContract.strain}"]`);
  }

  if (deal.recommendedAuction && deal.recommendedAuction.length > 0) {
    lines.push(`[Auction "${deal.dealer}"]`);
    const auctionRows: string[] = [];
    for (let i = 0; i < deal.recommendedAuction.length; i += 4) {
      auctionRows.push(deal.recommendedAuction.slice(i, i + 4).join(' '));
    }
    lines.push(...auctionRows);
  }

  if (deal.teacherGoal) {
    lines.push(`{ Cel szkoleniowy: ${deal.teacherGoal} }`);
  }
  if (deal.generalNotes) {
    lines.push(`{ Notatki instruktora: ${deal.generalNotes} }`);
  }

  return lines.join('\n');
}

/**
 * Basic parser for full PBN text pasted by teacher
 */
export function importFromPbn(pbnText: string): Partial<Deal> | null {
  const lines = pbnText.split('\n');
  let title = 'Importowane rozdanie PBN';
  let dealer: Direction = 'N';
  let vul: Vulnerability = 'None';
  let hands: Record<Direction, Card[]> | null = null;
  const auction: string[] = [];
  let inAuction = false;
  let teacherGoal = '';
  let notes = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('%') || line === '') continue;

    if (line.startsWith('{') && line.endsWith('}')) {
      const comment = line.substring(1, line.length - 1).trim();
      if (comment.includes('Cel szkoleniowy:')) {
        teacherGoal = comment.replace('Cel szkoleniowy:', '').trim();
      } else {
        notes += (notes ? ' ' : '') + comment;
      }
      continue;
    }

    const tagMatch = line.match(/^\[(\w+)\s+"(.*)"\]$/);
    if (tagMatch) {
      inAuction = false;
      const [, tag, value] = tagMatch;
      if (tag === 'Event') title = value;
      else if (tag === 'Dealer') {
        const d = value.toUpperCase() as Direction;
        if (['N', 'E', 'S', 'W'].includes(d)) dealer = d;
      } else if (tag === 'Vulnerable') {
        if (['None', 'NS', 'EW', 'All'].includes(value)) vul = value as Vulnerability;
      } else if (tag === 'Deal') {
        hands = parsePbnDeal(value);
      } else if (tag === 'Auction') {
        inAuction = true;
      }
    } else if (inAuction) {
      const calls = line.split(/\s+/).filter(Boolean);
      for (const c of calls) {
        if (c !== '+' && c !== '*') auction.push(c);
      }
    }
  }

  if (!hands) return null;

  return {
    title,
    dealer,
    vulnerability: vul,
    hands,
    recommendedAuction: auction.length > 0 ? auction : undefined,
    teacherGoal,
    generalNotes: notes,
    category: 'Własne lekcje',
    difficulty: 'Średniozaawansowany'
  };
}
