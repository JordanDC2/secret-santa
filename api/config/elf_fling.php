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
