<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Masuk · {{ $institution }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans text-slate-900 antialiased">
<main class="w-full max-w-md space-y-4">
    <div class="text-center">
        <p class="text-xs uppercase tracking-widest text-slate-500">Portal Akademik</p>
        <h1 class="text-2xl font-semibold">{{ $institution }}</h1>
    </div>
    <form method="POST" action="{{ route('login.store') }}" class="card space-y-4">
        @csrf
        @if ($errors->any())<p role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{{ $errors->first() }}</p>@endif
        <div><label class="label" for="username">Nama pengguna</label><input class="input" id="username" name="username" value="{{ old('username') }}" autocomplete="username" required autofocus></div>
        <div><label class="label" for="password">Kata sandi</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" required></div>
        <button class="btn w-full">Masuk</button>
    </form>
    <div class="card text-sm text-slate-600">
        <p class="mb-2 font-medium text-slate-800">Akun demo (data fiktif)</p>
        <ul class="grid grid-cols-2 gap-1">@foreach ($accounts as $u => $r)<li><code>{{ $u }}</code> · {{ $r }}</li>@endforeach</ul>
        <p class="mt-2">Kata sandi demo: <code>AkademikDemo!26</code></p>
    </div>
</main>
</body>
</html>
