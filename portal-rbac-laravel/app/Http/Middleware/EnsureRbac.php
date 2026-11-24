<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/** Pemakaian di rute: ->middleware('rbac:krs,view'). Menolak dengan 403 jika matriks tidak mengizinkan. */
class EnsureRbac
{
    public function handle(Request $request, Closure $next, string $resource, string $action): Response
    {
        abort_unless(Gate::allows('rbac', [$resource, $action]), 403, 'Peran Anda tidak memiliki izin untuk tindakan ini.');

        return $next($request);
    }
}
