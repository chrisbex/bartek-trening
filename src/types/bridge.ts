import { Direction, Vulnerability, Card, Strain, Call, Contract } from '../logic/bridgeRules';

export interface BiddingStepNote {
  call: string;
  explanation: string;
  hcpRange?: string;
  isConvention?: boolean;
}

export interface Deal {
  id: string;
  title: string;
  category: string;
  difficulty: 'Początkujący' | 'Średniozaawansowany' | 'Zaawansowany';
  description: string;
  teacherGoal: string;
  dealer: Direction;
  vulnerability: Vulnerability;
  hands: Record<Direction, Card[]>;
  recommendedAuction?: string[]; // e.g. ["1NT", "Pass", "2D", "Pass", "2H", "Pass", "3NT", "Pass", "Pass", "Pass"]
  auctionNotes?: Record<number, string>; // index of bid -> teacher commentary
  targetContract?: {
    level: number;
    strain: Strain;
    declarer: Direction;
  };
  tricksNotes?: Record<number, string>; // trick number 1..13 -> teaching tip
  generalNotes?: string;
  isUserCreated?: boolean;
  createdAt?: string;
}

export interface TableSettings {
  fourColorDeck: boolean; // green clubs, orange/blue diamonds, red hearts, black spades
  openCards: boolean; // Teacher mode: see all 4 hands
  autoPlaySingletons: boolean;
  fastTrickAnimation: boolean;
  soundEnabled: boolean;
  userSeat: Direction; // which seat the student is controlling (default 'S')
}
