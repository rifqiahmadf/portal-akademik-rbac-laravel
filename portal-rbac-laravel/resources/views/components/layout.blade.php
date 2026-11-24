@props(['title' => 'Portal'])
@php
    use App\Enums\Resource;
    use App\Support\Rbac;
    $user = auth()->user();
    $modules = Rbac::modules();
    $routes = ['me' => 'portal.profile', 'krs' => 'portal.krs', 'nilai' => 'portal.grades', 'registrasi' => 'portal.registrations', 'akun' => 'portal.accounts', 'konfigurasi' => 'portal.configuration'];
    $institution = \App\Models\Setting::current()->institution;
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} · {{ $institution }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
<div class="flex min-h-screen flex-col md:flex-row">
    <aside class="bg-brand-900 text-white md:w-64 md:shrink-0">
        <div class="px-5 py-5">
            <p class="text-xs uppercase tracking-widest text-brand-100/70">Portal Akademik</p>
            <p class="text-lg font-semibold">{{ $institution }}</p>
        </div>
        <nav class="flex flex-wrap gap-1 px-3 pb-4 md:flex-col" aria-label="Menu utama">
            @php
                $items = [['Ringkasan', route('portal.dashboard'), 'portal.dashboard'], ['Matriks akses', route('portal.matrix'), 'portal.matrix']];
                foreach (Rbac::resourcesFor($user->role) as $resource) {
                    $items[] = [$modules[$resource->value]['label'], route($routes[$resource->value]), $routes[$resource->value]];
                }
            @endphp
            @foreach ($items as [$label, $href, $name])
                <a href="{{ $href }}" @class(['rounded-lg px-3 py-2 text-sm', 'bg-white/15 font-semibold' => request()->routeIs($name), 'hover:bg-white/10' => ! request()->routeIs($name)]) @if (request()->routeIs($name)) aria-current="page" @endif>{{ $label }}</a>
            @endforeach
        </nav>
    </aside>
    <div class="flex-1">
        <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
            <h1 class="text-lg font-semibold">{{ $title }}</h1>
            <div class="flex items-center gap-3 text-sm">
                <span>{{ $user->name }} <span class="badge bg-brand-100 text-brand-900">{{ $user->role->label() }}</span></span>
                <form method="POST" action="{{ route('logout') }}">@csrf<button class="btn btn-secondary">Keluar</button></form>
            </div>
        </header>
        <main class="mx-auto max-w-5xl space-y-5 p-6">
            @if (session('status'))<div role="status" class="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">{{ session('status') }}</div>@endif
            @if (session('error'))<div role="alert" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{{ session('error') }}</div>@endif
            @if ($errors->any())<div role="alert" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"><ul class="list-inside list-disc">@foreach ($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul></div>@endif
            {{ $slot }}
        </main>
    </div>
</div>
</body>
</html>
