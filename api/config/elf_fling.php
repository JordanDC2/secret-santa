<?php

/*
|--------------------------------------------------------------------------
| Elf Fling
|--------------------------------------------------------------------------
|
| The game runs in the browser; the server keeps each player's coins and purchases and the
| throws behind the leaderboards. Prices here are the ones the server charges: keep them in
| step with the shop in web/src/Components/ElfFling (upgrades.ts and skins.ts), which shows
| them. One price per level; an item with one price is a single purchase.
|
| Prestige ("wrapping up Christmas") turns spare coins into gems and starts the coin shop
| over. Gems buy extra levels for a few upgrades, and keeping the rest through prestige.
|
*/

return [

    'upgrades' => [
        'swingStrength' => [25, 50, 80, 120, 175],
        'goldenCane' => [50, 110],
        'sledRunners' => [40, 80, 130],
        'springyBoots' => [45, 90, 140],
        'crackers' => [40],
        'paddedSuit' => [90, 260],
        'elfJump' => [60, 120, 200],
        'rocket' => [120],
        'skyOrnaments' => [150],
        'sleigh' => [250],
        'candyMagnet' => [35, 75, 130],
        'luckyStocking' => [100, 220],
    ],

    // Endless coin upgrades, from the second Christmas on (after this many prestiges): no top
    // level; level n costs round(base * growth ^ n). They reset with the coin shop.
    'endless_upgrades' => [
        'candyCanePolish' => ['base' => 250, 'growth' => 1.15],
        'workshopOvertime' => ['base' => 300, 'growth' => 1.15],
    ],
    'endless_from_prestige' => 1,

    // The gem shop's endless upgrade, priced the same way (in gems), and never reset.
    'endless_gem_upgrades' => [
        'santasLedger' => ['base' => 5, 'growth' => 1.25],
    ],

    // Each Santa's ledger level adds this share to a throw's coins.
    'santas_ledger_bonus' => 0.1,

    // Each workshop overtime level adds this share to a throw's coins.
    'workshop_overtime_bonus' => 0.02,

    // Gems per prestige: the square root of (spare coins / this), rounded down. 5,000 coins
    // make 22 gems; 20,000 make 44. Hoarding pays less and less, so prestiging again pays.
    'coins_per_gem_squared' => 10,

    // The gem shop, priced in gems, one price per level; gem levels never reset. Upgrades in
    // gem_extra sell extra levels on top of the coin shop's. The rest sell keeping the coin
    // shop's own levels through prestige, so they never need buying again.
    'gem_upgrades' => [
        'swingStrength' => [2, 3, 5, 7, 10],
        'goldenCane' => [2, 5],
        'sledRunners' => [2, 4, 7],
        'springyBoots' => [8],
        'crackers' => [3],
        'paddedSuit' => [3, 6],
        'elfJump' => [2, 4, 7],
        'rocket' => [4],
        'skyOrnaments' => [4],
        'sleigh' => [6],
        'candyMagnet' => [6],
        'luckyStocking' => [10],
        // Gem shop only: banked coins double with each level (×2, ×4, ×8).
        'christmasBonus' => [10, 25, 50],
        // Gem shop only: every hit launches 30% harder (the game applies it).
        'offSeasonTraining' => [20],
        // Gem shop only: half the air drag (the game applies it).
        'polarJetStream' => [35],
        // Power-ups (the game runs them): level 1 puts each on the course, the next make it last longer.
        'christmasStar' => [6, 12, 20],
        'gingerbreadMan' => [6, 12, 20],
        'snowAngelWings' => [6, 12, 20],
        'giantSnowball' => [6, 12, 20],
        'northWind' => [6, 12, 20],
        'hotCocoa' => [5, 10, 18],
        'spareFirework' => [10],
        // Yule log cannons on the course (the game runs them): each level fires harder.
        'yuleLog' => [8, 15, 25],
    ],
    // Every Christmas wrapped up after the first puts another Christmas bonus level on sale,
    // each this many times the price of the one before.
    'christmas_bonus_growth' => 2.2,

    'gem_extra' => [
        'springyBoots', 'candyMagnet', 'luckyStocking', 'christmasBonus', 'offSeasonTraining', 'polarJetStream',
        'christmasStar', 'gingerbreadMan', 'snowAngelWings', 'giantSnowball', 'northWind', 'hotCocoa',
        'spareFirework', 'yuleLog',
    ],

    // Who gets flung. The first is free and everyone has it.
    'skins' => [
        'elf' => 0,
        'santa' => 150,
        'mrsClaus' => 150,
        'snowman' => 200,
        'reindeer' => 300,
    ],

    // Who swings. The first is free and everyone has it.
    'batters' => [
        'reindeer' => 0,
        'elf' => 120,
        'santa' => 180,
        'mrsClaus' => 180,
        'snowman' => 220,
    ],

    // Each lucky stocking level adds this share to a throw's coins.
    'lucky_stocking_bonus' => 0.25,

    // No limits on how far or how rich a throw can be: long runs and big hauls are the point,
    // and nobody's faking results. These are just what the database columns can hold.
    'max_distance' => 999999,
    'max_coins' => 1000000000,

    'leaderboard_size' => 20,

];
