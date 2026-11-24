<x-layout title="Matriks akses">
    <p class="text-sm text-slate-600"><strong>L</strong> = Lihat, <strong>T</strong> = Tambah, <strong>U</strong> = Ubah, <strong>H</strong> = Hapus, <strong>—</strong> = ditolak. Kolom peran Anda disorot.</p>
    <div class="card overflow-x-auto p-0">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50"><tr><th class="th">Aktivitas</th>@foreach ($roles as $r)<th @class(['th', 'bg-brand-50 text-brand-900' => $r === $current])>{{ $r->label() }}</th>@endforeach</tr></thead>
            <tbody class="divide-y divide-slate-100">
            @foreach ($modules as $key => $m)
                <tr>
                    <td class="td font-medium">{{ $m['activity'] }}</td>
                    @foreach ($roles as $r)
                        @php($granted = collect($actions)->filter(fn ($a) => isset($m['access'][$r->value][$a->value])))
                        <td @class(['td', 'bg-brand-50' => $r === $current])>
                            @if ($granted->isEmpty())<span class="text-slate-400">—</span>
                            @else
                                <p class="font-semibold">{{ $granted->map->initial()->join(', ') }}</p>
                                <ul class="mt-1 space-y-0.5 text-xs text-slate-500">@foreach ($granted as $a)<li>{{ $a->initial() }} · {{ $m['access'][$r->value][$a->value] }}</li>@endforeach</ul>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</x-layout>
