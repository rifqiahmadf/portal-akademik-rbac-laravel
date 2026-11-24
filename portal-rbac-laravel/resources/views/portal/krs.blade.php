<x-layout title="Kartu rencana studi">
    <p class="text-sm text-slate-600">Periode KRS: <span @class(['badge', 'bg-emerald-100 text-emerald-800' => $open, 'bg-slate-200 text-slate-700' => ! $open])>{{ $open ? 'Dibuka' : 'Ditutup' }}</span> · Registrasi: <strong>{{ $registrationStatus ?? '—' }}</strong></p>
    <div class="card overflow-x-auto p-0"><table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50"><tr><th class="th">Kelas</th><th class="th">Mata kuliah</th><th class="th">SKS</th><th class="th">Jadwal</th><th class="th">Dosen</th><th class="th">Status</th><th class="th"></th></tr></thead>
        <tbody class="divide-y divide-slate-100">
        @foreach ($courses as $c)
            @php($e = $enrollments->get($c->id))
            <tr>
                <td class="td font-medium">{{ $c->code }}</td><td class="td">{{ $c->name }}</td><td class="td">{{ $c->credits }}</td><td class="td">{{ $c->schedule }}</td>
                <td class="td">{{ $c->lecturer->name }} ({{ $c->lecturer_id }})</td>
                <td class="td">@if ($e){{ $e->grade ? 'Nilai '.$e->grade->score : 'Diajukan' }}@else <span class="text-slate-400">Belum diajukan</span>@endif</td>
                <td class="td text-right">
                    @if (! $e)
                        <form method="POST" action="{{ route('portal.krs.store', $c) }}">@csrf<button class="btn" @disabled(! $open || $registrationStatus !== 'Aktif')>Ajukan</button></form>
                    @elseif (! $e->grade)
                        <form method="POST" action="{{ route('portal.krs.destroy', $c) }}">@csrf @method('DELETE')<button class="btn btn-secondary" @disabled(! $open)>Tarik</button></form>
                    @endif
                </td>
            </tr>
        @endforeach
        </tbody>
    </table></div>
</x-layout>
