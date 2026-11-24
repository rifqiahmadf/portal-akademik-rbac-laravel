<?php

namespace App\Providers;

use App\Enums\Action;
use App\Enums\Resource;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        // Gate tunggal untuk matriks RBAC: Gate::allows('rbac', ['krs', 'view'])
        Gate::define('rbac', function (User $user, string $resource, string $action): bool {
            $resource = Resource::tryFrom($resource);
            $action = Action::tryFrom($action);

            return $resource && $action && Rbac::can($user->role, $resource, $action);
        });
    }
}
