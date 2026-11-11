import { Deal } from '../types/bridge';
import { parsePbnHand } from '../utils/pbnParser';

export const PRESET_DEALS: Deal[] = [
  {
    id: 'lesson-1-finesse',
    title: 'Lekcja 1: Impas prosty w kolorze roboczym',
    category: 'Rozgrywka w bez atu',
    difficulty: 'Początkujący',
    description: 'Klasyczny kontrakt 3BA. Na stole widzimy króla z waletem, a w ręce asa. Jak bezpiecznie wyrobić lewy w kolorze karo?',
    teacherGoal: 'Nauka techniki impasu prostego: zagranie z ręki małej karty w stronę figury na stole (AQ lub KJ) i przepuszczenie pod domniemaną figurę przeciwnika.',
    dealer: 'S',
    vulnerability: 'None',
    hands: {
      // PBN order: S.H.D.C
      // Dummy (North)
      N: parsePbnHand('A74.K85.KJ42.Q73'),
      // East
      E: parsePbnHand('JT8.J93.975.JT84'),
      // Declarer (South)
      S: parsePbnHand('K92.AQ2.AT63.A95'),
      // West (Leader)
      W: parsePbnHand('Q653.T764.Q8.K62')
    },
    targetContract: {
      level: 3,
      strain: 'NT',
      declarer: 'S'
    },
    recommendedAuction: ['1NT', 'Pass', '3NT', 'Pass', 'Pass', 'Pass'],
    auctionNotes: {
      0: 'S ma 16 PC w składzie zrównoważonym (4-3-3-3) – idealne otwarcie 1BA (15-17 PC).',
      1: 'W pasuje z brakiem siły na wejście.',
      2: 'N ma 11 PC w składzie zrównoważonym – bezpośrednie podniesienie do 3BA (końcówka bezatutowa).',
      3: 'E pasuje.',
      4: 'S i W pasują – licytacja zakończona, kontrakt 3BA z ręki S.'
    },
    tricksNotes: {
      1: 'Wistuje West czwórką pik (czwarta najlepsza z długości). Wygraj tę lewę asem na stole lub królem w ręce.',
      2: 'Zlicz lewy natychmiastowe: 2 piki, 3 kiery, 2 trefle, 2 kara = 9 lew. Aby zdobyć nadróbki, zagraj małe karo z ręki w kierunku KJ na stole i przepuść waleta (impas damy u W)!',
      3: 'Impas się powiódł – dama karo była u W! Teraz masz pełną kontrolę nad rozdaniem.'
    },
    generalNotes: 'Pamiętaj: Impas to szansa 50%, ale gdy brakuje nam lew lub gramy na nadróbki, jest kluczową techniką wypracowywania lew bez oddawania tempa.'
  },
  {
    id: 'lesson-2-transfers',
    title: 'Lekcja 2: Transfer Jacobiego i licytacja z fitem starszym',
    category: 'Licytacja jednostronna',
    difficulty: 'Początkujący',
    description: 'Po otwarciu 1BA partner ma 5-kartowy kolor starszy. Zastosuj transfer 2♦, aby to silniejsza ręka (1BA) rozgrywała kontrakt!',
    teacherGoal: 'Zrozumienie mechanizmu transferów po otwarciu 1BA oraz wyboru właściwego kontraktu końcowego w kierach (4♥).',
    dealer: 'N',
    vulnerability: 'NS',
    hands: {
      // North opened 1NT
      N: parsePbnHand('K83.KQ4.AJ7.K862'),
      E: parsePbnHand('J94.T6.T852.T954'),
      // South responds with 5 hearts
      S: parsePbnHand('A72.AJ875.K93.Q3'),
      W: parsePbnHand('QT65.932.Q64.AJ7')
    },
    targetContract: {
      level: 4,
      strain: 'H',
      declarer: 'N'
    },
    recommendedAuction: ['1NT', 'Pass', '2D', 'Pass', '2H', 'Pass', '4H', 'Pass', 'Pass', 'Pass'],
    auctionNotes: {
      0: 'N: Otwarcie 1BA (16 PC, skład zrównoważony 3-3-3-4).',
      2: 'S: Odzywka 2♦ – Transfer Jacobiego! Oznacza: "Partnerze, zalicytuj 2♥, mam co najmniej 5 kierów".',
      4: 'N: Obowiązkowe przyjęcie transferu – 2♥.',
      6: 'S: Mając 14 PC i 5 kierów (fit gwarantowany 8+), S skacze do końcówki 4♥. Kontrakt rozgrywa N!'
    },
    tricksNotes: {
      1: 'Wistuje East dziesiątką trefl. Zauważ, że dzięki transferowi silniejsza ręka N jest ukryta!',
      2: 'Oddaj atuty przeciwnikom – zagraj króla i damę kier. Atuty dzielą się 3-2.',
      3: 'Po wyczyszczeniu atutów zrealizuj swoje honory w pikach i karach.'
    },
    generalNotes: 'Korzyść z transferu: Ręka 1BA z wieloma figurami i widłami (np. AJ, KQ) nie jest narażona na niekorzystny wist z lewej strony.'
  },
  {
    id: 'lesson-3-holdup',
    title: 'Lekcja 3: Zasada przepuszczenia (Hold-up Play)',
    category: 'Rozgrywka w bez atu',
    difficulty: 'Średniozaawansowany',
    description: 'Grasz 3BA. Obrońca wistuje w swój długi kolor pikowy. Masz asa pik z dwoma blotkami. Kiedy należy wziąć lewę asem?',
    teacherGoal: 'Opanowanie manewru przepuszczenia (hold-up play) w celu zerwania komunikacji między obrońcami, nim oddasz lewę w kolorze wypracowywanym.',
    dealer: 'S',
    vulnerability: 'None',
    hands: {
      N: parsePbnHand('64.AK3.T864.A752'),
      E: parsePbnHand('J93.976.QJ72.JT6'),
      S: parsePbnHand('A82.Q84.A95.KQ83'),
      W: parsePbnHand('KQT75.JT52.K3.94')
    },
    targetContract: {
      level: 3,
      strain: 'NT',
      declarer: 'S'
    },
    recommendedAuction: ['1NT', 'Pass', '3NT', 'Pass', 'Pass', 'Pass'],
    auctionNotes: {
      0: 'S: Otwarcie 1BA (15 PC).',
      2: 'N: 11 PC, zrównoważony – podniesienie do 3BA.'
    },
    tricksNotes: {
      1: 'Wistuje West królem pik! Przepuść tę lewę (zagraj małego pika ze stołu i z ręki)!',
      2: 'West kontynuuje damą pik. Ponownie przepuść! East dokłada swojego ostatniego pika.',
      3: 'Trzeciego pika musisz wziąć asem. Teraz East nie ma już ani jednego pika! Możesz bezpiecznie zagrać trefle i wyrobić 9 lew bez obawy o wpadkę.'
    },
    generalNotes: 'Zasada 7: Jeśli łączna liczba kart w kolorze ataku u ciebie i na stole wynosi N, zazwyczaj przepuszczasz (7 - N) razy.'
  },
  {
    id: 'lesson-4-ruffing',
    title: 'Lekcja 4: Bicie w krótszej ręce (dziadku)',
    category: 'Rozgrywka atutowa',
    difficulty: 'Początkujący',
    description: 'Kontrakt 4♠. W ręce masz 5 pików, a na stole 3. Jak wygenerować dodatkową lewę za pomocą przebitki?',
    teacherGoal: 'Zrozumienie, że przebitka w ręce o mniejszej liczbie atutów (w dziadku) daje ZYSK w lewach, w przeciwieństwie do przebitki w ręce długiej.',
    dealer: 'S',
    vulnerability: 'All',
    hands: {
      N: parsePbnHand('Q94.3.KQ852.K972'),
      E: parsePbnHand('T8.JT864.J74.QJ5'),
      S: parsePbnHand('AK762.A75.A93.A4'),
      W: parsePbnHand('J53.KQ92.T6.T863')
    },
    targetContract: {
      level: 4,
      strain: 'S',
      declarer: 'S'
    },
    recommendedAuction: ['1S', 'Pass', '2D', 'Pass', '3S', 'Pass', '4S', 'Pass', 'Pass', 'Pass'],
    auctionNotes: {
      0: 'S otwiera 1♠ z 20 PC i 5-kartem pikowym.',
      2: 'N odpowiada 2♦ (naturalne, forsowne do dogranej).',
      4: 'S powtarza piki z przeskokiem (3♠), a N stawia końcówkę 4♠.'
    },
    tricksNotes: {
      1: 'Wistuje West królem kier. Weź asem w ręce.',
      2: 'Masz 2 przegrywające kiery w ręce, a na stole singla! Zagraj małego kiera i PRZEBIJ go na stole małym pikiem!',
      3: 'Dzięki temu zdobyłeś lewę przebitkową, a twoje 5 pików w ręce nadal pozostaje nienaruszone!'
    },
    generalNotes: 'Kluczowa zasada brydża: Przebitki w ręce z dłuższą liczbą atutów nie dają zysku (zmniejszają tylko długość atutową), ale przebitka w stole ZWIĘKSZA sumę lew o 1.'
  },
  {
    id: 'lesson-5-defense-rule11',
    title: 'Lekcja 5: Obrona i wist – Reguła 11 w praktyce',
    category: 'Gra w obronie',
    difficulty: 'Średniozaawansowany',
    description: 'Siedzisz na pozycji East. Rozgrywający gra 3BA. Twój partner (West) wistuje 6 pik. Jak zinterpretować tę kartę?',
    teacherGoal: 'Praktyczne zastosowanie Reguły 11 do obliczenia, ile kart wyższych od wistu ma rozgrywający w ręce.',
    dealer: 'S',
    vulnerability: 'EW',
    hands: {
      // Student is East!
      E: parsePbnHand('AJ4.862.K73.T862'),
      S: parsePbnHand('K82.AK5.A94.Q973'),
      W: parsePbnHand('QT965.J74.Q82.J4'),
      N: parsePbnHand('73.QT93.JT65.AK5')
    },
    targetContract: {
      level: 3,
      strain: 'NT',
      declarer: 'S'
    },
    recommendedAuction: ['1NT', 'Pass', '3NT', 'Pass', 'Pass', 'Pass'],
    auctionNotes: {
      0: 'S otwiera 1BA, N skacze do 3BA.'
    },
    tricksNotes: {
      1: 'West wistuje 6♠ (czwarta najlepsza). Reguła 11: 11 - 6 = 5 kart wyższych od szóstki na rękach N, E i S. Na stole (N) widzisz 73 (0 wyższych). Ty na E masz AJ (2 wyższe). Zatem rozgrywający (S) ma DOKŁADNIE: 5 - 2 = 3 karty wyższe od 6!',
      2: 'Stół kładzie 3. Nie musisz kłaść asa! Wskocz waletem lub przepuść, by zablokować rozgrywającego.',
      3: 'Świetna obrona: piki zostały rozpracowane i obrońcy kładą kontrakt 3BA!'
    },
    generalNotes: 'Reguła 11 działa przy wiście czwartą najlepszą: odejmując wartość karty od 11, otrzymujesz liczbę kart wyższych u pozostałych trzech graczy.'
  },
  {
    id: 'lesson-6-slam',
    title: 'Lekcja 6: Kontrakt szlemikowy w trefle (6♣)',
    category: 'Licytacja zaawansowana i szlemiki',
    difficulty: 'Zaawansowany',
    description: 'Wielka strefa szlemowa. Wykrycie fitu treflowego, zapytanie o asy (Blackwood) i precyzyjne odliczenie 12 lew.',
    teacherGoal: 'Zastosowanie konwencji Blackwooda (4BA), kontrola asów i realizacja kontraktu szlemikowego przez bezpieczną komunikację.',
    dealer: 'S',
    vulnerability: 'None',
    hands: {
      N: parsePbnHand('KQ4.AJ7.K8.KJ973'),
      E: parsePbnHand('987.964.QJT9.652'),
      S: parsePbnHand('AJ5.KQ5.A72.AQT8'),
      W: parsePbnHand('T632.T832.6543.4')
    },
    targetContract: {
      level: 6,
      strain: 'C',
      declarer: 'S'
    },
    recommendedAuction: ['1C', 'Pass', '2C', 'Pass', '4NT', 'Pass', '5H', 'Pass', '6C', 'Pass', 'Pass', 'Pass'],
    auctionNotes: {
      0: 'S otwiera 1♣ (silna ręka 21 PC).',
      2: 'N odpowiada 2♣ (odwrócony trefl – silny fit z 15 PC).',
      4: 'S pyta o asy odzywką 4BA (Blackwood).',
      6: 'N odpowiada 5♥ (dwa asy).',
      8: 'S mając 2 asy i wiedząc o 2 asach u N stawia szlemika 6♣!'
    },
    tricksNotes: {
      1: 'Wistuje West damą karo. Weź asem w ręce.',
      2: 'Sprawdź podział atutów – zagraj asa trefl. Trefle dzielą się 3-1.',
      3: 'Ściągnij pozostałe atuty i zrealizuj lewy w pikach i kierach. Gratulacje – 12 lew w kieszeni (+920 pkt)!'
    },
    generalNotes: 'Przy szlemikach najważniejsze jest sprawdzenie liczby brakujących asów (brak 2 asów uniemożliwia szlemika) oraz zliczenie pewnych lew.'
  }
];
