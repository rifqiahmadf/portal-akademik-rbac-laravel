<x-layout title="Registrasi">
    <div class="card overflow-x-auto p-0"><table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50"><tr><th class="th">Mahasiswa</th><th class="th">Program studi</th><th class="th">Angkatan</th><th class="th">Status</th><th class="th"></th></tr></thead>
        <tbody class="divide-y divide-slate-100">
        @foreach ($records as $r)
            <tr><form method="POST" action="{{ route('portal.registrations.update', $r) }}">@csrf @method('PATCH')
                <td class="td font-medium">{{ $r->student->name }}</td>
                <td class="td"><select class="input" name="program" aria-label="Program studi">@foreach ($programs as $p)<option @selected($r->program === $p)>{{ $p }}</option>@endforeach</select></td>
                <td class="td"><input class="input w-24" type="number" name="cohort" min="2000" max="2100" value="{{ $r->cohort }}" aria-label="Angkatan"></td>
                <td class="td"><select class="input" name="status" aria-label="Status">@foreach ($statuses as $s)<option @selected($r->status === $s)>{{ $s }}</option>@endforeach</select></td>
                <td class="td"><button class="btn">Simpan</button></td>
            </form></tr>
        @endforeach
        </tbody>
    </table></div>
</x-layout>
