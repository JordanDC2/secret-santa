<?php

namespace App\Console\Commands;

use App\Events\AppDeployed;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:announce-deploy {version : The commit the web app was built from}')]
#[Description('Tell open pages a new version is live, so they offer to refresh (run by deploy/update.sh)')]
class AnnounceDeploy extends Command
{
    public function handle(): int
    {
        AppDeployed::dispatch((string) $this->argument('version'));

        $this->info('Announced version '.$this->argument('version'));

        return self::SUCCESS;
    }
}
