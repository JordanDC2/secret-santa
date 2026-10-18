<?php

namespace App\Http\Controllers\ElfFling;

use App\Actions\ElfFling\BuyItem;
use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\PurchaseRequest;
use App\Http\Resources\ElfFlingProgressResource;

/**
 * Buys from the shop at the server's prices.
 */
class PurchaseHandler extends Controller
{
    public function __invoke(BuyItem $buyItem, PurchaseRequest $request): ElfFlingProgressResource
    {
        /** @var 'upgrade'|'gemUpgrade'|'skin'|'batter' $kind */
        $kind = $request->string('kind')->value();

        return new ElfFlingProgressResource($buyItem(
            $request->user(),
            $kind,
            $request->string('item')->value(),
            $request->integer('count', 1),
        ));
    }
}
