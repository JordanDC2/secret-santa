<x-mail::layout>
{{-- Head: the web app's heading font. Clients that block web fonts fall back to Georgia. --}}
<x-slot:head>
<link href="https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@700&display=swap" rel="stylesheet">
</x-slot:head>

{{-- Header --}}
<x-slot:header>
<tr>
<td class="header">
<div class="header-snow">❄ ❄ ❄</div>
<a href="{{ config('app.frontend_url') }}" style="display: inline-block;">🎅 {{ config('app.name') }}</a>
<div class="header-snow">❄ ❄ ❄</div>
</td>
</tr>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
🎄 Sent with holiday cheer from the North Pole 🎄
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
