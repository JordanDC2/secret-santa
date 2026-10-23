<?php

/*
|--------------------------------------------------------------------------
| Silent Night
|--------------------------------------------------------------------------
|
| The game runs in the browser; the server keeps each player's coal, what they've bought in
| the Coal Cellar and which patrons, cast and guns they've unlocked, and the nights behind the leaderboards. Prices
| here are the ones the server charges: keep them in step with web/src/Components/SilentNight
| (cast.ts and guns.ts), which show them. One price per level.
|
*/

return [

    // Coal earned by a night: so much per stretch of it survived, per so many slain, per boss
    // beaten, and more for beating Krampus at dawn.
    'coal' => [
        'seconds_per_coal' => 20,
        'kills_per_coal' => 40,
        'per_boss' => 20,
        'for_winning' => 60,
    ],

    'cellar' => [
        'wool' => [30, 60, 100, 150, 220],
        'canes' => [40, 80, 130, 200, 300],
        'boots' => [40, 90, 160],
        'dice' => [50, 120, 220],
        'fire' => [50, 120, 220],
        'prayers' => [50, 120],
    ],

    // The second wave of patrons, and the coal to unlock each (the first five are always there).
    'patrons' => [
        'befana' => 200,
        'yuleGoat' => 200,
        'mariLwyd' => 200,
    ],

    // Who can play, and the coal to unlock each; the first is free.
    'cast' => [
        'elf' => 0,
        'santa' => 150,
        'mrsClaus' => 150,
        'snowman' => 250,
        'reindeer' => 350,
    ],

    // The guns to choose from before a night, and the coal to unlock each (all less than any of
    // the cast); the first is free.
    'guns' => [
        'gun' => 0,
        'blunderbuss' => 60,
        'crossbow' => 80,
        'pistols' => 80,
        'romanCandle' => 100,
        'snowCannon' => 120,
    ],

];
