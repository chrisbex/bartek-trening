import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCard,
  calculateHCP,
  sortHand,
  isLegalCardPlay,
  determineTrickWinner,
  evaluateAuction,
  calculateBridgeScore,
  Trick,
  PlayedCard
} from './bridgeRules';

test('calculateHCP computes correct High Card Points', () => {
  const hand = [
    createCard('S', 'A'), // 4
    createCard('S', 'K'), // 3
    createCard('H', 'Q'), // 2
    createCard('D', 'J'), // 1
    createCard('C', 'T'), // 0
    createCard('C', '2'), // 0
  ];
  assert.equal(calculateHCP(hand), 10);
});

test('isLegalCardPlay enforces following suit when possible', () => {
  const hand = [
    createCard('H', 'A'),
    createCard('H', '9'),
    createCard('S', 'K'),
    createCard('C', '4'),
  ];

  const trickWithHeartLead: Trick = {
    cards: [
      { card: createCard('H', '2'), playedBy: 'W' }
    ],
    leader: 'W',
    trumpSuit: 'S'
  };

  // Must follow Heart
  assert.equal(isLegalCardPlay(createCard('H', 'A'), hand, trickWithHeartLead), true);
  assert.equal(isLegalCardPlay(createCard('H', '9'), hand, trickWithHeartLead), true);
  // Playing Spade or Club while having Hearts is illegal
  assert.equal(isLegalCardPlay(createCard('S', 'K'), hand, trickWithHeartLead), false);
  assert.equal(isLegalCardPlay(createCard('C', '4'), hand, trickWithHeartLead), false);

  // If trick led in Diamonds (which hand is void of), any card in hand is legal
  const trickWithDiamondLead: Trick = {
    cards: [
      { card: createCard('D', 'K'), playedBy: 'W' }
    ],
    leader: 'W',
    trumpSuit: 'S'
  };
  assert.equal(isLegalCardPlay(createCard('H', 'A'), hand, trickWithDiamondLead), true);
  assert.equal(isLegalCardPlay(createCard('S', 'K'), hand, trickWithDiamondLead), true);
});

test('determineTrickWinner correctly identifies highest card or trump', () => {
  // Trick without trump: high card of lead suit wins
  const trickNoTrump: Trick = {
    leader: 'W',
    cards: [
      { card: createCard('H', 'K'), playedBy: 'W' },
      { card: createCard('H', 'A'), playedBy: 'N' },
      { card: createCard('H', '4'), playedBy: 'E' },
      { card: createCard('S', 'A'), playedBy: 'S' } // Discard S-A (not trump)
    ],
    trumpSuit: null
  };
  assert.equal(determineTrickWinner(trickNoTrump), 'N');

  // Trick with trump: trump beats higher lead suit card
  const trickWithTrump: Trick = {
    leader: 'W',
    cards: [
      { card: createCard('C', 'A'), playedBy: 'W' },
      { card: createCard('C', '3'), playedBy: 'N' },
      { card: createCard('S', '2'), playedBy: 'E' }, // E ruffs with trump 2
      { card: createCard('S', '7'), playedBy: 'S' }  // S overruffs with trump 7
    ],
    trumpSuit: 'S'
  };
  assert.equal(determineTrickWinner(trickWithTrump), 'S');
});

test('evaluateAuction determines declarer and dummy correctly', () => {
  // Auction: N: 1NT, E: Pass, S: 3NT, W: Pass, N: Pass, E: Pass
  const auction = [
    { call: '1NT', by: 'N' as const },
    { call: 'Pass', by: 'E' as const },
    { call: '3NT', by: 'S' as const },
    { call: 'Pass', by: 'W' as const },
    { call: 'Pass', by: 'N' as const },
    { call: 'Pass', by: 'E' as const },
  ];

  const evalResult = evaluateAuction('N', auction, 'NS');
  assert.equal(evalResult.isAuctionFinished, true);
  assert.ok(evalResult.contract);
  assert.equal(evalResult.contract?.level, 3);
  assert.equal(evalResult.contract?.strain, 'NT');
  assert.equal(evalResult.contract?.declarer, 'N'); // N bid NT first on NS side
  assert.equal(evalResult.contract?.dummy, 'S');
});

test('calculateBridgeScore calculates vulnerable 3NT score with overtrick', () => {
  const contract = {
    level: 3,
    strain: 'NT' as const,
    doubled: false,
    redoubled: false,
    declarer: 'S' as const,
    dummy: 'N' as const,
    vulnerability: 'NS' as const
  };

  // 3NT vulnerable: 9 tricks needed. If 10 tricks made -> 3NT + 1 overtrick
  // Trick points: 40 + 30 + 30 = 100.
  // Game bonus (vul): 500.
  // Overtrick: 30. Total = 630.
  const scoreResult = calculateBridgeScore(contract, 10);
  assert.equal(scoreResult.isMade, true);
  assert.equal(scoreResult.score, 630);
  assert.equal(scoreResult.resultString, '+1');
});
